import prisma from '../../config/prisma.js';
import scoringService from './scoring.service.js';
import embeddingService from './embedding.service.js';
import llmExplanationService from './llmExplanation.service.js';
import { SCORING_CONFIG } from '../../config/scoring.js';
import { notFound, badRequest } from '../../utils/errors.js';

class RecommendationService {
  /**
   * Run the hybrid recommendation pipeline for the authenticated student.
   */
  async generateRecommendations(userId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        grades: true
      }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    if (!student.riasecScores) {
      throw badRequest('Please complete the RIASEC psychometric assessment before generating recommendations');
    }

    // Ensure student has embedding
    let studentEmbedding = student.embedding;
    if (!studentEmbedding || !Array.isArray(studentEmbedding) || studentEmbedding.length === 0) {
      studentEmbedding = await embeddingService.computeStudentEmbedding(student);
      await prisma.student.update({
        where: { id: student.id },
        data: { embedding: studentEmbedding }
      });
    }

    // Fetch all filières with schools and latest admission requirements
    const filieres = await prisma.filiere.findMany({
      include: {
        school: true,
        admissionRequirements: {
          orderBy: { year: 'desc' },
          take: 1
        },
        historicalCutoffs: {
          orderBy: { year: 'desc' },
          take: 3
        }
      }
    });

    if (filieres.length === 0) {
      return [];
    }

    // Score all filières
    const scoredList = [];

    for (const f of filieres) {
      const admissionReq = f.admissionRequirements[0] || null;

      // 1. Academic score with hard rules
      const academicRes = scoringService.computeAcademicScore(
        student.grades,
        admissionReq,
        student.bacTrack,
        f.requiredBacTracks
      );

      // 2. Interest score
      const interestScore = scoringService.computeInterestScore(
        student.preferences,
        f.tags
      );

      // 3. Personality / RIASEC alignment
      const riasecMatch = scoringService.computeRiasecMatch(
        student.riasecScores,
        f.riasecProfile
      );

      // 4. Structured score
      const structuredScore = scoringService.computeStructuredScore({
        interestScore,
        personalityScore: riasecMatch,
        academicScore: academicRes.academicScore,
        isEligible: academicRes.isEligible
      });

      // 5. Vector score
      const vectorScore = scoringService.computeVectorScore(
        studentEmbedding,
        f.embedding
      );

      // 6. Final composite score
      const finalScore = scoringService.computeFinalScore(structuredScore, vectorScore);

      scoredList.push({
        filiere: f,
        isEligible: academicRes.isEligible,
        reason: academicRes.reason,
        structuredScore,
        vectorScore,
        finalScore,
        academicScore: academicRes.academicScore,
        riasecMatch,
        interestScore
      });
    }

    // Sort by final score descending
    scoredList.sort((a, b) => b.finalScore - a.finalScore);

    // Take top N (default 10)
    const topCount = SCORING_CONFIG.recommendation.topRecommendationsCount;
    const topCandidates = scoredList.slice(0, topCount);

    // Generate explanations for top 5
    const llmTopCount = SCORING_CONFIG.recommendation.llmExplanationTopCount;
    const finalRecommendations = [];

    for (let i = 0; i < topCandidates.length; i++) {
      const item = topCandidates[i];
      const rank = i + 1;
      let explanation = null;

      if (i < llmTopCount) {
        explanation = await llmExplanationService.generateExplanation({
          filiereName: item.filiere.name,
          schoolName: item.filiere.school.name,
          finalScore: item.finalScore,
          structuredScore: item.structuredScore,
          vectorScore: item.vectorScore,
          riasecMatch: item.riasecMatch,
          academicScore: item.academicScore,
          rank
        });
      }

      finalRecommendations.push({
        studentId: student.id,
        filiereId: item.filiere.id,
        filiere: item.filiere,
        rank,
        structuredScore: item.structuredScore,
        vectorScore: item.vectorScore,
        finalScore: item.finalScore,
        explanation
      });
    }

    // Save recommendations to database in transaction
    await prisma.$transaction(async (tx) => {
      await tx.recommendation.deleteMany({
        where: { studentId: student.id }
      });

      for (const rec of finalRecommendations) {
        await tx.recommendation.create({
          data: {
            studentId: rec.studentId,
            filiereId: rec.filiereId,
            rank: rec.rank,
            structuredScore: rec.structuredScore,
            vectorScore: rec.vectorScore,
            finalScore: rec.finalScore,
            explanation: rec.explanation
          }
        });
      }
    });

    return this.getStudentRecommendations(student.id);
  }

  /**
   * Get latest stored recommendations for student.
   */
  async getStudentRecommendations(studentId) {
    return prisma.recommendation.findMany({
      where: { studentId },
      orderBy: { rank: 'asc' },
      include: {
        filiere: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                acronym: true,
                city: true,
                region: true,
                website: true,
                type: true
              }
            },
            admissionRequirements: {
              orderBy: { year: 'desc' },
              take: 1
            },
            historicalCutoffs: {
              orderBy: { year: 'desc' },
              take: 3
            }
          }
        }
      }
    });
  }

  async getRecommendationsByUserId(userId) {
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    return this.getStudentRecommendations(student.id);
  }
}

export default new RecommendationService();
