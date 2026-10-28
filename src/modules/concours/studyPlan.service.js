import prisma from '../../config/prisma.js';
import { notFound, badRequest } from '../../utils/errors.js';

class StudyPlanService {
  /**
   * Pure JS algorithm generating a structured revision plan and scheduled tasks.
   */
  generateSchedule({
    concours,
    questions = [],
    hoursPerWeek,
    examDate,
    weakTopics = []
  }) {
    const now = new Date();
    const targetDate = new Date(examDate);
    const msDiff = targetDate.getTime() - now.getTime();
    const daysUntilExam = Math.max(7, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, Math.ceil(daysUntilExam / 7));

    // Extract unique topics grouped by subjectCode
    const topicMap = new Map();
    for (const q of questions) {
      if (!topicMap.has(q.subjectCode)) {
        topicMap.set(q.subjectCode, new Set());
      }
      topicMap.get(q.subjectCode).add(q.topic);
    }

    const allTopicItems = [];
    for (const [subjectCode, topicsSet] of topicMap.entries()) {
      for (const topic of topicsSet) {
        const isWeak = weakTopics.includes(topic);
        allTopicItems.push({
          subjectCode,
          topic,
          isWeak
        });
        // Duplicate weak topics to give them double practice time
        if (isWeak) {
          allTopicItems.push({
            subjectCode,
            topic,
            isWeak: true
          });
        }
      }
    }

    if (allTopicItems.length === 0) {
      // Fallback topic if no questions loaded yet
      const subjects = Array.isArray(concours.subjects) ? concours.subjects : ['MATH', 'PHYSICS'];
      for (const s of subjects) {
        allTopicItems.push({ subjectCode: s, topic: 'Révision Générale', isWeak: false });
      }
    }

    // Number of sessions per week (default 90 min = 1.5h per session)
    const sessionDurationMin = 90;
    const sessionsPerWeek = Math.max(2, Math.round((hoursPerWeek * 60) / sessionDurationMin));
    const totalAvailableSessions = sessionsPerWeek * totalWeeks;

    const tasks = [];
    let topicIndex = 0;

    // Distribute sessions week by week
    for (let week = 0; week < totalWeeks; week++) {
      const isEveryTwoWeeks = (week + 1) % 2 === 0;
      const isFinalWeek = week === totalWeeks - 1;

      for (let session = 0; session < sessionsPerWeek; session++) {
        // Calculate task date
        const dayOffset = week * 7 + Math.floor((session * 7) / sessionsPerWeek);
        const taskDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);

        // Schedule mock exam every 2 weeks or 1 week before exam
        if ((isEveryTwoWeeks || isFinalWeek) && session === sessionsPerWeek - 1) {
          tasks.push({
            date: taskDate,
            subjectCode: 'CONCOURS_GLOBAL',
            topic: isFinalWeek ? 'Concours Blanc Final (Conditions Réelles)' : `Concours Blanc Périodique (Semaine ${week + 1})`,
            durationMin: 120,
            type: 'MOCK_EXAM',
            status: 'TODO'
          });
          continue;
        }

        const currentTopicItem = allTopicItems[topicIndex % allTopicItems.length];
        topicIndex++;

        const taskType = session % 2 === 0 ? 'REVISION' : 'PRACTICE';
        tasks.push({
          date: taskDate,
          subjectCode: currentTopicItem.subjectCode,
          topic: currentTopicItem.topic,
          durationMin: sessionDurationMin,
          type: taskType,
          status: 'TODO'
        });
      }
    }

    return tasks;
  }

  /**
   * Create study plan for student.
   */
  async createStudyPlan(userId, { concoursId, hoursPerWeek, examDate }) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        examAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!student) throw notFound('Student not found');

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      include: { questions: true }
    });

    if (!concours) throw notFound(`Concours with ID ${concoursId} not found`);

    // Detect weak topics from past attempts
    const weakTopics = [];
    for (const att of student.examAttempts) {
      if (att.scoreByTopic && typeof att.scoreByTopic === 'object') {
        for (const [topic, data] of Object.entries(att.scoreByTopic)) {
          if (data && typeof data === 'object' && data.accuracyPercentage < 50) {
            if (!weakTopics.includes(topic)) weakTopics.push(topic);
          }
        }
      }
    }

    const scheduledTasks = this.generateSchedule({
      concours,
      questions: concours.questions,
      hoursPerWeek,
      examDate,
      weakTopics
    });

    // Save study plan and tasks in database transaction
    const studyPlan = await prisma.$transaction(async (tx) => {
      // Archive or delete older study plans for this concours
      await tx.studyPlan.deleteMany({
        where: { studentId: student.id, concoursId }
      });

      const plan = await tx.studyPlan.create({
        data: {
          studentId: student.id,
          concoursId,
          hoursPerWeek,
          examDate: new Date(examDate),
          weakTopics
        }
      });

      for (const t of scheduledTasks) {
        await tx.studyTask.create({
          data: {
            studyPlanId: plan.id,
            date: t.date,
            subjectCode: t.subjectCode,
            topic: t.topic,
            durationMin: t.durationMin,
            type: t.type,
            status: t.status
          }
        });
      }

      return plan;
    });

    return prisma.studyPlan.findUnique({
      where: { id: studyPlan.id },
      include: {
        concours: true,
        tasks: { orderBy: { date: 'asc' } }
      }
    });
  }

  /**
   * Get active study plans for student.
   */
  async getMyStudyPlans(userId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    return prisma.studyPlan.findMany({
      where: { studentId: student.id },
      include: {
        concours: true,
        tasks: { orderBy: { date: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update study task status (TODO, IN_PROGRESS, DONE).
   */
  async updateTaskStatus(userId, taskId, status) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const task = await prisma.studyTask.findUnique({
      where: { id: taskId },
      include: { studyPlan: true }
    });

    if (!task || task.studyPlan.studentId !== student.id) {
      throw notFound('Study task not found');
    }

    return prisma.studyTask.update({
      where: { id: taskId },
      data: { status }
    });
  }

  /**
   * Regenerate study plan incorporating new weak topics and updated timeline.
   */
  async regeneratePlan(userId, planId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id: planId }
    });

    if (!existingPlan || existingPlan.studentId !== student.id) {
      throw notFound('Study plan not found');
    }

    return this.createStudyPlan(userId, {
      concoursId: existingPlan.concoursId,
      hoursPerWeek: existingPlan.hoursPerWeek,
      examDate: existingPlan.examDate
    });
  }
}

export default new StudyPlanService();
