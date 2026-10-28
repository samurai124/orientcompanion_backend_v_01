import { SCORING_CONFIG } from '../../config/scoring.js';
import { cosineSimilarity, normalizeVectorScore } from '../../utils/vectorUtils.js';

class ScoringService {
  constructor() {
    this.config = SCORING_CONFIG.recommendation;
  }

  /**
   * Computes interest compatibility between student preferences and filière tags (0-100).
   */
  computeInterestScore(studentPreferences = {}, filiereTags = []) {
    if (!filiereTags || filiereTags.length === 0) {
      return 70.0; // Neutral baseline
    }

    const interests = Array.isArray(studentPreferences.interests)
      ? studentPreferences.interests.map(i => i.toLowerCase().trim())
      : [];

    if (interests.length === 0) {
      return 70.0;
    }

    const tags = filiereTags.map(t => t.toLowerCase().trim());
    let matches = 0;

    for (const interest of interests) {
      if (tags.some(t => t.includes(interest) || interest.includes(t))) {
        matches++;
      }
    }

    const ratio = matches / Math.min(interests.length, 3);
    const score = 50 + ratio * 50; // Between 50 and 100
    return Math.min(100, Math.round(score * 10) / 10);
  }

  /**
   * Computes Holland RIASEC personality alignment (0-100).
   * Calculates inverted normalized L1 distance across 6 dimensions.
   */
  computeRiasecMatch(studentScores = {}, filiereProfile = {}) {
    const dimensions = ['R', 'I', 'A', 'S', 'E', 'C'];
    let totalDiff = 0;

    for (const dim of dimensions) {
      const sVal = typeof studentScores[dim] === 'number' ? studentScores[dim] : 50;
      const fVal = typeof filiereProfile[dim] === 'number' ? filiereProfile[dim] : 50;
      totalDiff += Math.abs(sVal - fVal);
    }

    // Max possible difference is 6 * 100 = 600
    const match = 100 - (totalDiff / 600) * 100;
    return Math.max(0, Math.min(100, Math.round(match * 10) / 10));
  }

  /**
   * Computes academic eligibility and weighted grade score (0-100).
   * Failed hard rules return 0.
   */
  computeAcademicScore(studentGrades = [], admissionRequirement, studentBacTrack, requiredBacTracks = []) {
    // Hard Rule 1: Bac Track Eligibility
    if (studentBacTrack && Array.isArray(requiredBacTracks) && requiredBacTracks.length > 0) {
      const isTrackEligible = requiredBacTracks.map(t => t.toUpperCase()).includes(studentBacTrack.toUpperCase());
      if (!isTrackEligible) {
        return { academicScore: 0, weightedAverage: 0, isEligible: false, reason: 'BAC_TRACK_INELIGIBLE' };
      }
    }

    if (!admissionRequirement) {
      return { academicScore: 70.0, weightedAverage: 14.0, isEligible: true, reason: null };
    }

    const weights = admissionRequirement.subjectWeights || {};
    const minSubjectGrades = admissionRequirement.minSubjectGrades || {};
    const minAverage = admissionRequirement.minAverage || 10.0;

    // Build map of student subject grades (latest or highest grade per subject)
    const gradeMap = {};
    for (const g of studentGrades) {
      const code = g.subjectCode.toUpperCase();
      if (!gradeMap[code] || g.gradeValue > gradeMap[code]) {
        gradeMap[code] = g.gradeValue;
      }
    }

    // Hard Rule 2: Minimum subject grades check
    for (const [subj, minVal] of Object.entries(minSubjectGrades)) {
      const current = gradeMap[subj.toUpperCase()];
      if (current !== undefined && current < minVal) {
        return { academicScore: 0, weightedAverage: 0, isEligible: false, reason: `GRADE_BELOW_MINIMUM_${subj}` };
      }
    }

    // Compute weighted average
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [subj, weight] of Object.entries(weights)) {
      const w = Number(weight) || 0;
      if (w <= 0) continue;
      const grade = gradeMap[subj.toUpperCase()] !== undefined ? gradeMap[subj.toUpperCase()] : 12.0; // Default baseline if not yet passed
      weightedSum += grade * w;
      totalWeight += w;
    }

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 12.0;

    // Hard Rule 3: Minimum average check
    if (studentGrades.length > 0 && weightedAverage < minAverage) {
      return { academicScore: 0, weightedAverage: Number(weightedAverage.toFixed(2)), isEligible: false, reason: 'AVERAGE_BELOW_THRESHOLD' };
    }

    const academicScore = Math.min(100, Math.max(0, (weightedAverage / 20.0) * 100));
    return {
      academicScore: Math.round(academicScore * 10) / 10,
      weightedAverage: Math.round(weightedAverage * 100) / 100,
      isEligible: true,
      reason: null
    };
  }

  /**
   * Pure JS calculation of structured score:
   * Structured = interest * 0.30 + personality * 0.40 + academic * 0.30
   */
  computeStructuredScore({ interestScore, personalityScore, academicScore, isEligible = true }) {
    if (!isEligible || academicScore === 0) {
      return 0.0;
    }

    const { weights } = this.config;
    const structured = (
      interestScore * weights.interest +
      personalityScore * weights.personality +
      academicScore * weights.academic
    );

    return Math.round(structured * 10) / 10;
  }

  /**
   * Vector Score = ((cosineSimilarity + 1) / 2) * 100
   */
  computeVectorScore(studentEmbedding, filiereEmbedding) {
    if (!studentEmbedding || !filiereEmbedding) {
      return 50.0;
    }
    const similarity = cosineSimilarity(studentEmbedding, filiereEmbedding);
    const score = normalizeVectorScore(similarity);
    return Math.round(score * 10) / 10;
  }

  /**
   * Final Score = structured * 0.60 + vector * 0.40
   */
  computeFinalScore(structuredScore, vectorScore) {
    if (structuredScore === 0) {
      return 0.0;
    }
    const { hybridWeights } = this.config;
    const finalScore = (
      structuredScore * hybridWeights.structured +
      vectorScore * hybridWeights.vector
    );
    return Math.round(finalScore * 10) / 10;
  }
}

export default new ScoringService();
