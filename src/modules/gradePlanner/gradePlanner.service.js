import prisma from '../../config/prisma.js';
import { SCORING_CONFIG } from '../../config/scoring.js';
import llmClient from '../../utils/llmClient.js';
import { notFound, forbidden, badRequest } from '../../utils/errors.js';

class GradeTargetService {
  constructor() {
    this.config = SCORING_CONFIG.gradePlanner;
  }

  /**
   * Check whether student can create another goal according to plan limits.
   */
  async checkGoalQuota(userId, studentId) {
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endsAt: { gt: new Date() },
        plan: { code: 'PREMIUM' }
      }
    });

    const isPremium = Boolean(activeSub);
    if (isPremium) {
      return; // Unlimited goals for premium
    }

    const currentCount = await prisma.gradeGoal.count({
      where: { studentId }
    });

    if (currentCount >= this.config.freePlanGoalLimit) {
      throw forbidden(
        `La formule gratuite est limitée à ${this.config.freePlanGoalLimit} objectif actif. Passez à la formule Premium pour un nombre illimité d'objectifs cibles.`,
        null,
        'PREMIUM_REQUIRED'
      );
    }
  }

  /**
   * Pure JS core calculation of target requirements and feasibility.
   */
  calculateTargetRequirements(gradesMap, admissionRequirement, historicalCutoffs = []) {
    const weights = admissionRequirement?.subjectWeights || { MATH: 0.5, PC: 0.3, SVT: 0.2 };
    const minSubjectGrades = admissionRequirement?.minSubjectGrades || {};
    const minAverage = admissionRequirement?.minAverage || 12.0;

    // 1. Target average = max(minAverage, average of the last 3 cutoffs)
    let cutoffsAverage = minAverage;
    if (historicalCutoffs.length > 0) {
      const topCutoffs = historicalCutoffs.slice(0, this.config.defaultCutoffYears);
      const sumCutoffs = topCutoffs.reduce((acc, c) => acc + c.cutoffScore, 0);
      cutoffsAverage = sumCutoffs / topCutoffs.length;
    }
    const targetAverage = Math.round(Math.max(minAverage, cutoffsAverage) * 100) / 100;

    // 2. Current weighted average = Σ(w_i·g_i) / Σ(w_i)
    let totalWeight = 0;
    let currentWeightedSum = 0;
    const subjects = Object.keys(weights);

    for (const subj of subjects) {
      const w = Number(weights[subj]) || 0;
      totalWeight += w;
      const current = gradesMap[subj.toUpperCase()] !== undefined ? Number(gradesMap[subj.toUpperCase()]) : 10.0;
      currentWeightedSum += current * w;
    }

    const currentWeightedAverage = totalWeight > 0
      ? Math.round((currentWeightedSum / totalWeight) * 100) / 100
      : 10.0;

    // Overall gap
    const overallGap = Math.round((targetAverage - currentWeightedAverage) * 100) / 100;

    // Feasibility status
    let feasibility = 'ON_TRACK';
    if (overallGap <= this.config.thresholds.onTrackMaxGap) {
      feasibility = 'ON_TRACK';
    } else if (overallGap <= this.config.thresholds.atRiskMaxGap) {
      feasibility = 'AT_RISK';
    } else {
      feasibility = 'UNLIKELY';
    }

    // 3. Required grade per subject
    const avgWeight = totalWeight > 0 && subjects.length > 0 ? totalWeight / subjects.length : 1;
    const subjectAnalysis = [];

    for (const subj of subjects) {
      const w = Number(weights[subj]) || 0;
      const currentGrade = gradesMap[subj.toUpperCase()] !== undefined ? Number(gradesMap[subj.toUpperCase()]) : 10.0;
      const minRequired = minSubjectGrades[subj.toUpperCase()] || this.config.minGrade;

      // Distribute gap proportionally to subject weight
      const weightFactor = avgWeight > 0 ? w / avgWeight : 1;
      const delta = overallGap > 0 ? overallGap * weightFactor : 0;
      const unconstrainedRequired = Math.round((currentGrade + delta) * 10) / 10;

      // Enforce minimum subject requirement and cap at 20
      const constrainedRequired = Math.max(minRequired, Math.min(this.config.maxGrade, unconstrainedRequired));
      const subjectGap = Math.round((constrainedRequired - currentGrade) * 10) / 10;
      const exceeds20 = unconstrainedRequired > this.config.maxGrade;

      let priority = 'LOW';
      if (w >= 0.4 && subjectGap > 0) {
        priority = 'HIGH';
      } else if (subjectGap > 0) {
        priority = 'MEDIUM';
      }

      subjectAnalysis.push({
        subject: subj,
        weight: w,
        currentGrade,
        requiredGrade: constrainedRequired,
        gap: subjectGap,
        minSubjectRequirement: minRequired,
        exceeds20,
        unconstrainedRequired: exceeds20 ? unconstrainedRequired : undefined,
        priority
      });
    }

    return {
      targetAverage,
      currentWeightedAverage,
      overallGap,
      feasibility,
      subjects: subjectAnalysis,
      disclaimer: 'Données basées sur les seuils d’admission et historiques de la dernière année disponible.'
    };
  }

  /**
   * Generate French personalized study advice from numbers.
   */
  async generateAdvice(filiereName, requirements) {
    const templateAdvice = (
      `Pour intégrer ${filiereName}, votre moyenne cible est de ${requirements.targetAverage}/20 ` +
      `(Moyenne actuelle estimée : ${requirements.currentWeightedAverage}/20, Écart global : ${requirements.overallGap} pts). ` +
      `Votre statut de faisabilité est '${requirements.feasibility}'. ` +
      `Concentrez en priorité vos révisions sur les matières à fort coefficient présentant un écart.`
    );

    const prompt = `
Tu es un conseiller pédagogique expert au Maroc.
Rédige 2 à 3 phrases de conseils concrets en français pour un élève visant la filière "${filiereName}".
Données chiffrées calculées :
- Moyenne cible : ${requirements.targetAverage}/20
- Moyenne pondérée actuelle : ${requirements.currentWeightedAverage}/20
- Écart global : ${requirements.overallGap} points
- Faisabilité : ${requirements.feasibility}
- Matières prioritaires : ${requirements.subjects.filter(s => s.priority === 'HIGH').map(s => s.subject).join(', ') || 'Toutes les matières'}

Ne recalcule rien. Donne un conseil encourageant et pragmatique.
`.trim();

    return llmClient.generateText(prompt, templateAdvice);
  }

  /**
   * Create a new Grade Target Goal for a filière.
   */
  async createGoal(userId, filiereId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { grades: true }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    await this.checkGoalQuota(userId, student.id);

    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: {
        admissionRequirements: { orderBy: { year: 'desc' }, take: 1 },
        historicalCutoffs: { orderBy: { year: 'desc' }, take: 3 }
      }
    });

    if (!filiere) {
      throw notFound(`Filière with ID ${filiereId} not found`);
    }

    const gradeMap = {};
    for (const g of student.grades) {
      gradeMap[g.subjectCode.toUpperCase()] = g.gradeValue;
    }

    const reqs = this.calculateTargetRequirements(
      gradeMap,
      filiere.admissionRequirements[0],
      filiere.historicalCutoffs
    );

    const advice = await this.generateAdvice(filiere.name, reqs);
    reqs.advice = advice;

    const goal = await prisma.gradeGoal.create({
      data: {
        studentId: student.id,
        filiereId,
        computedRequirements: reqs,
        feasibility: reqs.feasibility
      },
      include: {
        filiere: {
          include: { school: true }
        }
      }
    });

    return goal;
  }

  /**
   * Get all active goals for student.
   */
  async getGoals(userId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    return prisma.gradeGoal.findMany({
      where: { studentId: student.id },
      include: {
        filiere: {
          include: { school: true }
        }
      },
      orderBy: { computedAt: 'desc' }
    });
  }

  /**
   * Delete a grade goal.
   */
  async deleteGoal(userId, goalId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const goal = await prisma.gradeGoal.findUnique({ where: { id: goalId } });
    if (!goal || goal.studentId !== student.id) {
      throw notFound('Grade goal not found');
    }

    await prisma.gradeGoal.delete({ where: { id: goalId } });
  }

  /**
   * Simulate hypothetical grades on a target filière without persisting.
   */
  async simulateGrades(filiereId, hypotheticalGrades) {
    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: {
        admissionRequirements: { orderBy: { year: 'desc' }, take: 1 },
        historicalCutoffs: { orderBy: { year: 'desc' }, take: 3 }
      }
    });

    if (!filiere) {
      throw notFound(`Filière with ID ${filiereId} not found`);
    }

    const reqs = this.calculateTargetRequirements(
      hypotheticalGrades,
      filiere.admissionRequirements[0],
      filiere.historicalCutoffs
    );

    const advice = await this.generateAdvice(filiere.name, reqs);
    reqs.advice = advice;

    return {
      filiereId: filiere.id,
      filiereName: filiere.name,
      schoolName: filiere.school?.name,
      simulation: reqs
    };
  }
}

export default new GradeTargetService();
