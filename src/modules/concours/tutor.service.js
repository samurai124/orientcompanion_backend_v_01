import prisma from '../../config/prisma.js';
import { SCORING_CONFIG } from '../../config/scoring.js';
import llmClient from '../../utils/llmClient.js';
import { notFound, forbidden } from '../../utils/errors.js';

class TutorService {
  constructor() {
    this.dailyLimit = SCORING_CONFIG.tutor.dailyLimitPremium;
  }

  /**
   * AI Concours Tutor with daily rate limiting and strict grounding on stored explanations.
   */
  async askTutor(userId, { questionId, questionText }) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    // Check daily questions quota
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const questionsAskedToday = await prisma.chatMessage.count({
      where: {
        studentId: student.id,
        sessionId: 'ai-tutor-session',
        role: 'USER',
        createdAt: { gte: startOfDay }
      }
    });

    if (questionsAskedToday >= this.dailyLimit) {
      throw forbidden(
        `Limite quotidienne atteinte (${this.dailyLimit} questions par jour). Revenez demain pour poser de nouvelles questions au tuteur.`,
        { limit: this.dailyLimit, usedToday: questionsAskedToday },
        'TUTOR_DAILY_LIMIT_EXCEEDED'
      );
    }

    // 1. If questionId is provided, retrieve official stored explanation
    if (questionId) {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { concours: true }
      });

      if (!question) throw notFound(`Question with ID ${questionId} not found`);

      // Record question in history for quota tracking
      await prisma.chatMessage.create({
        data: {
          studentId: student.id,
          sessionId: 'ai-tutor-session',
          role: 'USER',
          content: `Question #${question.id}: ${question.statement}`
        }
      });

      const explanation = question.explanation || 'Aucune explication détaillée n’est enregistrée pour cette question.';

      await prisma.chatMessage.create({
        data: {
          studentId: student.id,
          sessionId: 'ai-tutor-session',
          role: 'ASSISTANT',
          content: explanation
        }
      });

      return {
        type: 'QUESTION_EXPLANATION',
        questionId: question.id,
        subjectCode: question.subjectCode,
        topic: question.topic,
        correctOption: question.correctOption,
        explanation,
        source: 'STORED_CURRICULUM_DATA',
        remainingToday: this.dailyLimit - (questionsAskedToday + 1)
      };
    }

    // 2. General concours preparation inquiry via LLM
    await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        sessionId: 'ai-tutor-session',
        role: 'USER',
        content: questionText
      }
    });

    const fallbackAnswer = (
      `Pour réussir vos concours (ENSA, ENCG, Médecine, CPGE), assurez-vous de bien maîtriser les concepts clés du programme du Baccalauréat marocain, ` +
      `de vous entraîner régulièrement sur les annales en temps limité, et de revoir systématiquement vos erreurs de méthode.`
    );

    const prompt = `
Tu es le Tuteur Intelligent officiel de préparation aux concours d'accès aux Grandes Écoles et Facultés marocaines (ENSA, ENCG, FMP, FST, CPGE).
Réponds en français avec précision, pédagogie et concision à la question suivante de l'élève :
"${questionText}"
`.trim();

    const response = await llmClient.generateText(prompt, fallbackAnswer);

    await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        sessionId: 'ai-tutor-session',
        role: 'ASSISTANT',
        content: response
      }
    });

    return {
      type: 'TUTOR_GUIDANCE',
      response,
      source: 'AI_TUTOR',
      remainingToday: this.dailyLimit - (questionsAskedToday + 1)
    };
  }
}

export default new TutorService();
