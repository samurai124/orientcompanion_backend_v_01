import gradePlannerService from '../src/modules/gradePlanner/gradePlanner.service.js';

describe('Grade Target Planner Core Calculations', () => {
  test('Target average computation: max(minAverage, average of last 3 cutoffs)', () => {
    const admissionRequirement = {
      minAverage: 14.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 }
    };
    const historicalCutoffs = [
      { year: 2023, cutoffScore: 16.0 },
      { year: 2022, cutoffScore: 15.5 },
      { year: 2021, cutoffScore: 15.0 }
    ];

    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 15.0, PC: 15.0 },
      admissionRequirement,
      historicalCutoffs
    );

    // Average of [16.0, 15.5, 15.0] = 15.50
    // max(14.0, 15.50) = 15.50
    expect(result.targetAverage).toBe(15.5);
  });

  test('Target average computation fallback when cutoffs are lower than minAverage', () => {
    const admissionRequirement = {
      minAverage: 15.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 }
    };
    const historicalCutoffs = [
      { year: 2023, cutoffScore: 14.0 },
      { year: 2022, cutoffScore: 13.5 },
      { year: 2021, cutoffScore: 13.0 }
    ];

    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 15.0, PC: 15.0 },
      admissionRequirement,
      historicalCutoffs
    );

    expect(result.targetAverage).toBe(15.0);
  });

  test('Feasibility determination: ON_TRACK (gap <= 0)', () => {
    const admissionRequirement = {
      minAverage: 14.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 }
    };
    // Current weighted average: (16.0*0.5 + 16.0*0.5) = 16.0 >= target 14.0 -> gap <= 0
    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 16.0, PC: 16.0 },
      admissionRequirement,
      []
    );

    expect(result.overallGap).toBeLessThanOrEqual(0);
    expect(result.feasibility).toBe('ON_TRACK');
  });

  test('Feasibility determination: AT_RISK (0 < gap <= 2.0)', () => {
    const admissionRequirement = {
      minAverage: 15.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 }
    };
    // Current weighted average: 14.0. Target: 15.0. Gap = 1.0 (between 0 and 2.0)
    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 14.0, PC: 14.0 },
      admissionRequirement,
      []
    );

    expect(result.overallGap).toBe(1.0);
    expect(result.feasibility).toBe('AT_RISK');
  });

  test('Feasibility determination: UNLIKELY (gap > 2.0)', () => {
    const admissionRequirement = {
      minAverage: 16.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 }
    };
    // Current weighted average: 12.0. Target: 16.0. Gap = 4.0 > 2.0
    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 12.0, PC: 12.0 },
      admissionRequirement,
      []
    );

    expect(result.overallGap).toBe(4.0);
    expect(result.feasibility).toBe('UNLIKELY');
  });

  test('Required grade caps at 20 and flags exceeds20 if mathematically unachievable', () => {
    const admissionRequirement = {
      minAverage: 18.0,
      subjectWeights: { MATH: 0.8, PC: 0.2 }
    };
    // Current grades very low (10.0), target high (18.0)
    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 10.0, PC: 10.0 },
      admissionRequirement,
      []
    );

    const mathAnalysis = result.subjects.find(s => s.subject === 'MATH');
    expect(mathAnalysis.requiredGrade).toBeLessThanOrEqual(20.0);
    if (mathAnalysis.unconstrainedRequired > 20.0) {
      expect(mathAnalysis.exceeds20).toBe(true);
    }
  });

  test('Enforces minSubjectGrades rule on required grades', () => {
    const admissionRequirement = {
      minAverage: 12.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 },
      minSubjectGrades: { MATH: 14.0 }
    };
    // Even if student has 12.0 average, MATH required grade must be at least 14.0
    const result = gradePlannerService.calculateTargetRequirements(
      { MATH: 10.0, PC: 16.0 },
      admissionRequirement,
      []
    );

    const mathAnalysis = result.subjects.find(s => s.subject === 'MATH');
    expect(mathAnalysis.requiredGrade).toBeGreaterThanOrEqual(14.0);
  });
});
