import prisma from '../../config/prisma.js';
import { notFound } from '../../utils/errors.js';
import { getPaginationParams, formatPaginatedResponse } from '../../utils/pagination.js';

class AdminService {
  // --- School CRUD ---
  async createSchool(data) {
    return prisma.school.create({ data });
  }

  async updateSchool(id, data) {
    return prisma.school.update({ where: { id }, data });
  }

  async deleteSchool(id) {
    return prisma.school.delete({ where: { id } });
  }

  // --- Filiere CRUD ---
  async createFiliere(data) {
    return prisma.filiere.create({ data });
  }

  async updateFiliere(id, data) {
    return prisma.filiere.update({ where: { id }, data });
  }

  async deleteFiliere(id) {
    return prisma.filiere.delete({ where: { id } });
  }

  // --- Requirements CRUD ---
  async createRequirement(data) {
    return prisma.admissionRequirement.create({ data });
  }

  async updateRequirement(id, data) {
    return prisma.admissionRequirement.update({ where: { id }, data });
  }

  async deleteRequirement(id) {
    return prisma.admissionRequirement.delete({ where: { id } });
  }

  // --- Cutoffs CRUD ---
  async createCutoff(data) {
    return prisma.historicalCutoff.create({ data });
  }

  async updateCutoff(id, data) {
    return prisma.historicalCutoff.update({ where: { id }, data });
  }

  async deleteCutoff(id) {
    return prisma.historicalCutoff.delete({ where: { id } });
  }

  // --- Documents CRUD ---
  async createDocument(data) {
    return prisma.requiredDocument.create({ data });
  }

  async updateDocument(id, data) {
    return prisma.requiredDocument.update({ where: { id }, data });
  }

  async deleteDocument(id) {
    return prisma.requiredDocument.delete({ where: { id } });
  }

  // --- Process CRUD ---
  async createProcess(data) {
    return prisma.applicationProcess.create({ data });
  }

  async updateProcess(id, data) {
    return prisma.applicationProcess.update({ where: { id }, data });
  }

  async deleteProcess(id) {
    return prisma.applicationProcess.delete({ where: { id } });
  }

  // --- User Management ---
  async getUsers(query) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where = {};

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          student: {
            select: { id: true, stage: true, bacTrack: true, bacYear: true }
          },
          counselor: {
            select: { id: true, specialties: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return formatPaginatedResponse(users, total, page, limit);
  }

  async updateUserStatus(id, status) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound(`User with ID ${id} not found`);

    return prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });
  }

  // --- Platform Statistics (Section 5.9) ---
  async getStats() {
    const [
      totalUsers,
      usersByRole,
      studentsByStage,
      totalRecommendations,
      totalMentorshipSessions,
      completedMentorshipSessions,
      activeSubscriptions,
      topRecommended
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.student.groupBy({
        by: ['stage'],
        _count: { id: true }
      }),
      prisma.recommendation.count(),
      prisma.mentorshipSession.count(),
      prisma.mentorshipSession.count({ where: { status: 'COMPLETED' } }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endsAt: { gt: new Date() }
        }
      }),
      prisma.recommendation.groupBy({
        by: ['filiereId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);

    // Fetch filiere names for top recommendations
    const topFilieres = await Promise.all(
      topRecommended.map(async (item) => {
        const filiere = await prisma.filiere.findUnique({
          where: { id: item.filiereId },
          select: { name: true, school: { select: { acronym: true } } }
        });
        return {
          filiereId: item.filiereId,
          filiereName: filiere ? `${filiere.school.acronym} - ${filiere.name}` : `Filière #${item.filiereId}`,
          recommendationCount: item._count.id
        };
      })
    );

    const mentorshipCompletionRate = totalMentorshipSessions > 0
      ? Number(((completedMentorshipSessions / totalMentorshipSessions) * 100).toFixed(1))
      : 0;

    return {
      totalUsers,
      activeSubscriptions,
      totalRecommendations,
      totalMentorshipSessions,
      completedMentorshipSessions,
      topRecommended: topFilieres,
      topRecommendedFilieres: topFilieres,
      overview: {
        totalUsers,
        activeSubscriptions,
        totalRecommendations,
        mentorshipCompletionRate
      },
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count.id;
        return acc;
      }, {}),
      studentsByStage: studentsByStage.reduce((acc, curr) => {
        acc[curr.stage] = curr._count.id;
        return acc;
      }, {}),
      mentorship: {
        totalSessions: totalMentorshipSessions,
        completedSessions: completedMentorshipSessions,
        completionRatePercentage: mentorshipCompletionRate
      }
    };
  }
}

export default new AdminService();
