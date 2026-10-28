import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import notificationService from '../notifications/notifications.service.js';
import { notFound, conflict, forbidden, badRequest } from '../../utils/errors.js';

export const VALID_TRANSITIONS = {
  REQUESTED: {
    SCHEDULED: ['COUNSELOR', 'ADMIN'],
    REJECTED: ['COUNSELOR', 'ADMIN'],
    CANCELLED: ['STUDENT', 'COUNSELOR', 'ADMIN']
  },
  SCHEDULED: {
    COMPLETED: ['COUNSELOR', 'ADMIN'],
    CANCELLED: ['STUDENT', 'COUNSELOR', 'ADMIN']
  },
  COMPLETED: {},
  CANCELLED: {},
  REJECTED: {}
};

/**
 * Enforces valid mentorship session lifecycle transitions.
 * Throws 409 CONFLICT on invalid transitions.
 */
export const transition = (currentStatus, targetStatus, role) => {
  const allowedRoles = VALID_TRANSITIONS[currentStatus]?.[targetStatus];
  if (!allowedRoles || !allowedRoles.includes(role)) {
    throw conflict(
      `Transition interdite : impossible de passer de '${currentStatus}' à '${targetStatus}' avec le rôle '${role}'.`
    );
  }
  return targetStatus;
};

class MentorshipService {
  /**
   * Request a mentorship session with a counselor.
   */
  async requestSession(userId, { counselorId, requestedStart, requestedEnd, subject }) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!student) throw notFound('Student not found');

    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId },
      include: {
        user: true,
        availabilitySlots: true
      }
    });

    if (!counselor) throw notFound(`Counselor with ID ${counselorId} not found`);

    const start = new Date(requestedStart);
    const end = new Date(requestedEnd);
    const now = new Date();

    // 1. Minimum 24 hours ahead check
    const minLeadTimeMs = 24 * 60 * 60 * 1000;
    if (start.getTime() - now.getTime() < minLeadTimeMs) {
      throw badRequest('Les séances d’orientation doivent être réservées au moins 24 heures à l’avance.');
    }

    if (end <= start) {
      throw badRequest('La date de fin doit être postérieure à la date de début.');
    }

    // 2. Availability slot check
    const dayOfWeek = start.getDay(); // 0 (Dimanche) to 6 (Samedi)
    const startHourStr = start.toTimeString().slice(0, 5); // "HH:MM"
    const endHourStr = end.toTimeString().slice(0, 5);

    const matchingSlot = counselor.availabilitySlots.find(slot => {
      return (
        slot.dayOfWeek === dayOfWeek &&
        slot.startTime <= startHourStr &&
        slot.endTime >= endHourStr
      );
    });

    if (!matchingSlot && counselor.availabilitySlots.length > 0) {
      throw badRequest(
        'Le créneau sélectionné ne correspond pas aux plages de disponibilité configurées par ce conseiller.'
      );
    }

    // 3. Conflict check with existing scheduled or requested sessions
    const conflictingSession = await prisma.mentorshipSession.findFirst({
      where: {
        counselorId,
        status: { in: ['REQUESTED', 'SCHEDULED'] },
        OR: [
          {
            requestedStart: { lte: start },
            requestedEnd: { gt: start }
          },
          {
            requestedStart: { lt: end },
            requestedEnd: { gte: end }
          }
        ]
      }
    });

    if (conflictingSession) {
      throw conflict('Ce conseiller a déjà une séance prévue sur ce créneau horaire.');
    }

    // 4. Check if student has active PREMIUM subscription for priority booking
    const activePremiumSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endsAt: { gt: now },
        plan: { code: 'PREMIUM' }
      }
    });

    const isPriority = Boolean(activePremiumSub);

    const session = await prisma.mentorshipSession.create({
      data: {
        studentId: student.id,
        counselorId,
        status: 'REQUESTED',
        requestedStart: start,
        requestedEnd: end,
        subject,
        priority: isPriority
      },
      include: {
        counselor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    // Notify counselor
    await notificationService.notify(
      counselor.userId,
      'MENTORSHIP_REQUESTED',
      'Nouvelle demande de mentorat',
      `L'élève ${student.user.firstName} ${student.user.lastName} a demandé une séance sur : "${subject}". Prioritaire : ${isPriority ? 'OUI' : 'NON'}.`,
      true
    );

    return session;
  }

  /**
   * Counselor accepts requested session. Generates meeting link and notifies both parties.
   */
  async acceptSession(user, sessionId) {
    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        counselor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    if (!session) throw notFound('Mentorship session not found');

    if (user.role === 'COUNSELOR' && session.counselor.userId !== user.id) {
      throw forbidden('You are not the designated counselor for this session');
    }

    transition(session.status, 'SCHEDULED', user.role);

    const meetingToken = crypto.randomBytes(6).toString('hex');
    const meetingLink = `https://meet.jit.si/orientcompanion-session-${session.id}-${meetingToken}`;

    const updated = await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: {
        status: 'SCHEDULED',
        meetingLink
      }
    });

    // Notify student and counselor
    await Promise.all([
      notificationService.notify(
        session.student.userId,
        'MENTORSHIP_ACCEPTED',
        'Séance de mentorat confirmée !',
        `Votre séance avec ${session.counselor.user.firstName} ${session.counselor.user.lastName} a été acceptée. Lien de visioconférence : ${meetingLink}`,
        true
      ),
      notificationService.notify(
        session.counselor.userId,
        'MENTORSHIP_CONFIRMED',
        'Séance planifiée',
        `Séance confirmée pour le ${session.requestedStart.toLocaleString('fr-FR')}. Lien : ${meetingLink}`,
        false
      )
    ]);

    return updated;
  }

  /**
   * Reject a requested session.
   */
  async rejectSession(user, sessionId) {
    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        counselor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    if (!session) throw notFound('Session not found');

    if (user.role === 'COUNSELOR' && session.counselor.userId !== user.id) {
      throw forbidden('You cannot reject sessions of other counselors');
    }

    transition(session.status, 'REJECTED', user.role);

    const updated = await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: { status: 'REJECTED' }
    });

    await notificationService.notify(
      session.student.userId,
      'MENTORSHIP_REJECTED',
      'Demande de séance refusée',
      `Votre conseiller n'est pas en mesure d'assurer la séance demandée pour le créneau choisi. Merci de sélectionner une autre plage horaire.`,
      true
    );

    return updated;
  }

  /**
   * Cancel an upcoming session (requested or scheduled).
   */
  async cancelSession(user, sessionId) {
    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        counselor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    if (!session) throw notFound('Session not found');

    transition(session.status, 'CANCELLED', user.role);

    const updated = await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' }
    });

    // Notify other participant
    const notifyUserId = user.role === 'STUDENT' ? session.counselor.userId : session.student.userId;
    await notificationService.notify(
      notifyUserId,
      'MENTORSHIP_CANCELLED',
      'Séance d’orientation annulée',
      `La séance prévue sur "${session.subject}" a été annulée.`
    );

    return updated;
  }

  /**
   * Counselor completes session with a written summary report.
   */
  async completeSession(user, sessionId, report) {
    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        counselor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    if (!session) throw notFound('Session not found');

    if (user.role === 'COUNSELOR' && session.counselor.userId !== user.id) {
      throw forbidden('You are not authorized to complete this session');
    }

    transition(session.status, 'COMPLETED', user.role);

    const updated = await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        report
      }
    });

    await notificationService.notify(
      session.student.userId,
      'MENTORSHIP_COMPLETED',
      'Compte-rendu de votre séance disponible',
      `Votre conseiller a déposé le bilan de votre entretien. Vous pouvez désormais évaluer la séance.`
    );

    return updated;
  }

  /**
   * Student rates completed session (1 to 5).
   */
  async rateSession(userId, sessionId, rating) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.studentId !== student.id) {
      throw notFound('Mentorship session not found');
    }

    if (session.status !== 'COMPLETED') {
      throw badRequest('Vous ne pouvez noter qu’une séance complétée.');
    }

    return prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: { rating }
    });
  }

  /**
   * Get sessions list for current user.
   */
  async getMySessions(user) {
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) return [];
      return prisma.mentorshipSession.findMany({
        where: { studentId: student.id },
        include: { counselor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
        orderBy: { requestedStart: 'desc' }
      });
    } else if (user.role === 'COUNSELOR') {
      const counselor = await prisma.counselor.findUnique({ where: { userId: user.id } });
      if (!counselor) return [];
      return prisma.mentorshipSession.findMany({
        where: { counselorId: counselor.id },
        include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
        orderBy: [{ priority: 'desc' }, { requestedStart: 'asc' }]
      });
    }

    return prisma.mentorshipSession.findMany({
      include: { student: { include: { user: true } }, counselor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- Counselor Availability Slots CRUD ---
  async getAvailability(userId) {
    const counselor = await prisma.counselor.findUnique({ where: { userId } });
    if (!counselor) throw notFound('Counselor profile not found');

    return prisma.availabilitySlot.findMany({
      where: { counselorId: counselor.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }

  async addAvailability(userId, data) {
    const counselor = await prisma.counselor.findUnique({ where: { userId } });
    if (!counselor) throw notFound('Counselor profile not found');

    if (data.startTime >= data.endTime) {
      throw badRequest('startTime must be strictly before endTime');
    }

    return prisma.availabilitySlot.create({
      data: {
        counselorId: counselor.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime
      }
    });
  }

  async deleteAvailability(userId, slotId) {
    const counselor = await prisma.counselor.findUnique({ where: { userId } });
    if (!counselor) throw notFound('Counselor profile not found');

    const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.counselorId !== counselor.id) {
      throw notFound('Availability slot not found');
    }

    return prisma.availabilitySlot.delete({ where: { id: slotId } });
  }

  async getCounselors() {
    return prisma.counselor.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        availabilitySlots: true
      }
    });
  }
}

export default new MentorshipService();
