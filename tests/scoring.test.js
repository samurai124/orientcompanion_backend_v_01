import scoringService from '../src/modules/recommendation/scoring.service.js';
import { cosineSimilarity, normalizeVectorScore } from '../src/utils/vectorUtils.js';

describe('Core Scoring Calculations & Recommendation Rules', () => {
  test('Worked example: structured 85.0, vector 86.0 -> final 85.4', () => {
    const structuredScore = 85.0;
    const vectorScore = 86.0;

    const finalScore = scoringService.computeFinalScore(structuredScore, vectorScore);

    // 85.0 * 0.60 = 51.0
    // 86.0 * 0.40 = 34.4
    // 51.0 + 34.4 = 85.4
    expect(finalScore).toBeCloseTo(85.4, 1);
    expect(finalScore).toBe(85.4);
  });

  test('Cosine similarity and normalization to 0-100 score', () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [1, 0, 0, 0];
    const simIdentical = cosineSimilarity(vecA, vecB);
    expect(simIdentical).toBeCloseTo(1.0, 4);
    expect(normalizeVectorScore(simIdentical)).toBeCloseTo(100.0, 1);

    const vecOrthogonal = [0, 1, 0, 0];
    const simOrthogonal = cosineSimilarity(vecA, vecOrthogonal);
    expect(simOrthogonal).toBeCloseTo(0.0, 4);
    expect(normalizeVectorScore(simOrthogonal)).toBeCloseTo(50.0, 1);

    const vecOpposite = [-1, 0, 0, 0];
    const simOpposite = cosineSimilarity(vecA, vecOpposite);
    expect(simOpposite).toBeCloseTo(-1.0, 4);
    expect(normalizeVectorScore(simOpposite)).toBeCloseTo(0.0, 1);
  });

  test('Structured score calculation matches weights (interest 0.30, personality 0.40, academic 0.30)', () => {
    const interestScore = 90.0;
    const personalityScore = 80.0;
    const academicScore = 70.0;

    // 90 * 0.30 = 27
    // 80 * 0.40 = 32
    // 70 * 0.30 = 21
    // Sum = 80.0
    const structured = scoringService.computeStructuredScore({
      interestScore,
      personalityScore,
      academicScore,
      isEligible: true
    });

    expect(structured).toBe(80.0);
  });

  test('Hard eligibility rule: ineligible bacTrack returns 0 academic score and 0 structured score', () => {
    const studentGrades = [
      { subjectCode: 'MATH', gradeValue: 18.0 },
      { subjectCode: 'PC', gradeValue: 17.5 }
    ];
    const admissionRequirement = {
      minAverage: 14.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 },
      minSubjectGrades: {}
    };

    const eligibleResult = scoringService.computeAcademicScore(
      studentGrades,
      admissionRequirement,
      'SM_A',
      ['SM_A', 'SM_B']
    );
    expect(eligibleResult.isEligible).toBe(true);
    expect(eligibleResult.academicScore).toBeGreaterThan(0);

    const ineligibleResult = scoringService.computeAcademicScore(
      studentGrades,
      admissionRequirement,
      'LETTRES',
      ['SM_A', 'SM_B']
    );
    expect(ineligibleResult.isEligible).toBe(false);
    expect(ineligibleResult.academicScore).toBe(0);

    const structured = scoringService.computeStructuredScore({
      interestScore: 90,
      personalityScore: 90,
      academicScore: ineligibleResult.academicScore,
      isEligible: ineligibleResult.isEligible
    });
    expect(structured).toBe(0.0);
  });

  test('Hard eligibility rule: grade below minimum subject threshold returns 0', () => {
    const studentGrades = [
      { subjectCode: 'MATH', gradeValue: 9.5 }, // Below 10.0 requirement
      { subjectCode: 'PC', gradeValue: 16.0 }
    ];
    const admissionRequirement = {
      minAverage: 12.0,
      subjectWeights: { MATH: 0.5, PC: 0.5 },
      minSubjectGrades: { MATH: 10.0 }
    };

    const result = scoringService.computeAcademicScore(
      studentGrades,
      admissionRequirement,
      'PC',
      ['PC', 'SM_A']
    );

    expect(result.isEligible).toBe(false);
    expect(result.academicScore).toBe(0);
  });
});
