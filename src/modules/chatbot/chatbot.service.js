import prisma from '../../config/prisma.js';
import llmClient from '../../utils/llmClient.js';
import { notFound } from '../../utils/errors.js';

class ChatbotService {
  /**
   * Determine the current dialogue state based on message count in this session.
   */
  determineNextState(userMessageCount) {
    switch (userMessageCount) {
      case 1:
        return 'ASK_INTERESTS';
      case 2:
        return 'ASK_GRADES';
      case 3:
        return 'ASK_PREFERRED_CITIES';
      default:
        return 'ADVICE_SUMMARY';
    }
  }

  /**
   * Process incoming message, advance the state machine, and reply.
   */
  async processMessage(userId, { sessionId, content }) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    // Save incoming user message
    await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        sessionId,
        role: 'USER',
        content
      }
    });

    // Count user messages in this session
    const userMessageCount = await prisma.chatMessage.count({
      where: {
        studentId: student.id,
        sessionId,
        role: 'USER'
      }
    });

    const nextState = this.determineNextState(userMessageCount);
    let replyText = '';

    if (nextState === 'ASK_INTERESTS') {
      replyText = (
        `Bonjour ${student.user.firstName} ! Ravi de vous accompagner sur OrientCompanion. ` +
        `Pour affiner votre orientation, quels sont vos domaines de prédilection ? ` +
        `(Par exemple : Informatique & Nouvelles Technologies, Médecine & Santé, Économie & Finance, ou Ingénierie & BTP ?)`
      );
    } else if (nextState === 'ASK_GRADES') {
      replyText = (
        `C'est un excellent choix d'intérêt. Pour que je puisse vérifier l'admissibilité dans les écoles cibles (ENSA, ENCG, FST, FMP, CPGE), ` +
        `quelle est votre moyenne générale actuelle ou votre note cible au Baccalauréat marocain (sur 20) ?`
      );
    } else if (nextState === 'ASK_PREFERRED_CITIES') {
      replyText = (
        `Merci pour ces précisions. Avez-vous une préférence géographique pour vos études supérieures ` +
        `(Casablanca, Rabat, Marrakech, Fès, Tanger, etc.) ?`
      );
    } else {
      replyText = (
        `Parfait ! Votre profil d'orientation est maintenant bien cadré. ` +
        `Je vous conseille de passer le questionnaire psychométrique Holland RIASEC dans l'onglet Évaluation, ` +
        `puis de générer vos recommandations personnalisées pour voir les filières où vos chances d'admission sont optimales.`
      );
    }

    // Optionally rephrase with LLM if available without modifying guidance logic
    const rephrased = await llmClient.generateText(
      `Reformule très légèrement ce message d'un conseiller d'orientation marocain avec politesse et clarté, sans changer les questions ni les consignes posées : "${replyText}"`,
      replyText
    );

    // Save assistant reply
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        sessionId,
        role: 'ASSISTANT',
        content: rephrased
      }
    });

    return {
      sessionId,
      role: 'ASSISTANT',
      content: assistantMessage.content,
      state: nextState,
      createdAt: assistantMessage.createdAt
    };
  }
}

export default new ChatbotService();
