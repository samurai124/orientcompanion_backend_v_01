/**
 * Centralized weights and thresholds for scoring algorithms, recommendations,
 * grade target planner, and exam calculations.
 * Never hard-code these values in services.
 */
export const SCORING_CONFIG = {
  // Recommendation pipeline weights
  recommendation: {
    weights: {
      interest: 0.30,
      personality: 0.40, // RIASEC match
      academic: 0.30
    },
    hybridWeights: {
      structured: 0.60,
      vector: 0.40
    },
    topRecommendationsCount: 10,
    llmExplanationTopCount: 5
  },

  // Grade Target Planner thresholds
  gradePlanner: {
    thresholds: {
      onTrackMaxGap: 0.0,       // gap <= 0 => ON_TRACK
      atRiskMaxGap: 2.0         // 0 < gap <= 2 => AT_RISK, gap > 2 => UNLIKELY
    },
    maxGrade: 20.0,
    minGrade: 0.0,
    defaultCutoffYears: 3,
    freePlanGoalLimit: 1
  },

  // Mock exam scoring settings
  mockExam: {
    correctMark: 1.0,
    blankMark: 0.0,
    incorrectMark: 0.0, // Configurable negative marking (e.g., -0.25)
    gracePeriodSeconds: 60
  },

  // AI Tutor limits
  tutor: {
    dailyLimitFree: 0,
    dailyLimitPremium: 20
  }
};

export default SCORING_CONFIG;
