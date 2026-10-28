import prisma from '../../config/prisma.js';
import { SCORING_CONFIG } from '../../config/scoring.js';
import { notFound, badRequest } from '../../utils/errors.js';
import { getPaginationParams, formatPaginatedResponse } from '../../utils/pagination.js';

class MockExamService {
  constructor() {
    this.config = SCORING_CONFIG.mockExam;
  }

  /**
   * Question bank with filters and pagination.
   */
  async getQuestionBank(query) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where = {};

    if (query.concoursId) where.concoursId = query.concoursId;
    if (query.subjectCode) where.subjectCode = query.subjectCode;
    if (query.topic) where.topic = { contains: query.topic };
    if (query.difficulty) where.difficulty = query.difficulty;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          concoursId: true,
          subjectCode: true,
          topic: true,
          difficulty: true,
          statement: true,
          options: true,
          correctOption: true,
          explanation: true
        },
        orderBy: { id: 'asc' }
      }),
      prisma.question.count({ where })
    ]);

    return formatPaginatedResponse(questions, total, page, limit);
  }

  /**
   * Start a mock exam: creates ExamAttempt and strips correctOption & explanation.
   */
  async startMockExam(userId, mockExamId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student profile not found');

    const mockExam = await prisma.mockExam.findUnique({
      where: { id: mockExamId },
      include: { concours: true }
    });

    if (!mockExam) {
      throw notFound(`Mock exam with ID ${mockExamId} not found`);
    }

    const questionIds = Array.isArray(mockExam.questionIds) ? mockExam.questionIds : [];
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        concoursId: true,
        subjectCode: true,
        topic: true,
        difficulty: true,
        statement: true,
        options: true // Exclude correctOption and explanation!
      }
    });

    // Create an unsubmitted attempt record
    const attempt = await prisma.examAttempt.create({
      data: {
        studentId: student.id,
        mockExamId: mockExam.id,
        startedAt: new Date()
      }
    });

    return {
      attemptId: attempt.id,
      mockExamId: mockExam.id,
      title: mockExam.title,
      concoursName: mockExam.concours.name,
      durationMinutes: mockExam.durationMinutes,
      startedAt: attempt.startedAt,
      questionsCount: questions.length,
      questions
    };
  }

  /**
   * Pure JS calculation of mock exam scoring.
   */
  calculateAttemptScore(questions, userAnswers) {
    let rawScore = 0;
    const scoreBySubject = {};
    const scoreByTopic = {};

    for (const q of questions) {
      const selected = userAnswers[q.id];
      const isAnswered = selected !== undefined && selected !== null;
      const isCorrect = isAnswered && Number(selected) === q.correctOption;

      // Subject tracking
      if (!scoreBySubject[q.subjectCode]) {
        scoreBySubject[q.subjectCode] = { total: 0, correct: 0, score: 0 };
      }
      scoreBySubject[q.subjectCode].total += 1;

      // Topic tracking
      if (!scoreByTopic[q.topic]) {
        scoreByTopic[q.topic] = { total: 0, correct: 0, accuracyPercentage: 0 };
      }
      scoreByTopic[q.topic].total += 1;

      if (isCorrect) {
        rawScore += this.config.correctMark;
        scoreBySubject[q.subjectCode].correct += 1;
        scoreBySubject[q.subjectCode].score += this.config.correctMark;
        scoreByTopic[q.topic].correct += 1;
      } else if (isAnswered) {
        rawScore += this.config.incorrectMark;
        scoreBySubject[q.subjectCode].score += this.config.incorrectMark;
      } else {
        rawScore += this.config.blankMark;
      }
    }

    // Calculate percentages for topics
    const weakTopics = [];
    for (const [topic, data] of Object.entries(scoreByTopic)) {
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      data.accuracyPercentage = accuracy;
      if (accuracy < 50) {
        weakTopics.push({ topic, accuracyPercentage: accuracy, totalQuestions: data.total });
      }
    }

    const totalQuestions = questions.length;
    const finalScore = Math.max(0, Math.round(rawScore * 100) / 100);
    const percentage = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0;

    return {
      score: finalScore,
      percentage,
      totalQuestions,
      scoreBySubject,
      scoreByTopic,
      weakTopics
    };
  }

  /**
   * Submit mock exam attempt, verify time limit with grace period, and score.
   */
  async submitMockExam(userId, mockExamId, userAnswers = {}) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const attempt = await prisma.examAttempt.findFirst({
      where: {
        mockExamId,
        studentId: student.id,
        submittedAt: null
      },
      orderBy: { startedAt: 'desc' },
      include: { mockExam: true }
    });

    if (!attempt) {
      throw badRequest('No active unsubmitted attempt found for this mock exam');
    }

    // Verify time limit with grace period
    const now = new Date();
    const durationMs = attempt.mockExam.durationMinutes * 60 * 1000;
    const graceMs = this.config.gracePeriodSeconds * 1000;
    const allowedEndTime = new Date(attempt.startedAt.getTime() + durationMs + graceMs);

    const isLate = now > allowedEndTime;

    // Fetch questions with correctOption and explanations
    const questionIds = Array.isArray(attempt.mockExam.questionIds) ? attempt.mockExam.questionIds : [];
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } }
    });

    const scoringResults = this.calculateAttemptScore(questions, userAnswers);

    // Update attempt record
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: now,
        answers: userAnswers,
        score: scoringResults.score,
        scoreBySubject: scoringResults.scoreBySubject,
        scoreByTopic: scoringResults.scoreByTopic
      }
    });

    // Build question-level corrections with stored explanations
    const corrections = questions.map(q => ({
      questionId: q.id,
      statement: q.statement,
      options: q.options,
      selectedOption: userAnswers[q.id] !== undefined ? userAnswers[q.id] : null,
      correctOption: q.correctOption,
      isCorrect: Number(userAnswers[q.id]) === q.correctOption,
      explanation: q.explanation
    }));

    return {
      attemptId: updatedAttempt.id,
      mockExamId: attempt.mockExam.id,
      title: attempt.mockExam.title,
      isLate,
      submittedAt: updatedAttempt.submittedAt,
      score: scoringResults.score,
      percentage: scoringResults.percentage,
      totalQuestions: scoringResults.totalQuestions,
      scoreBySubject: scoringResults.scoreBySubject,
      scoreByTopic: scoringResults.scoreByTopic,
      weakTopics: scoringResults.weakTopics,
      corrections
    };
  }

  /**
   * Get past exam attempts for student.
   */
  async getMyAttempts(userId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    return prisma.examAttempt.findMany({
      where: { studentId: student.id, submittedAt: { not: null } },
      include: {
        mockExam: {
          select: { id: true, title: true, durationMinutes: true, concours: { select: { name: true } } }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
  }
}

export default new MockExamService();
