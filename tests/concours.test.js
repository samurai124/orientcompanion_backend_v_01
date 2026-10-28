import mockExamService from '../src/modules/concours/mockExam.service.js';
import studyPlanService from '../src/modules/concours/studyPlan.service.js';

describe('Concours Companion Core Calculations', () => {
  describe('Mock Exam Scoring Engine', () => {
    const sampleQuestions = [
      { id: 1, subjectCode: 'MATH', topic: 'Analyse', correctOption: 1 },
      { id: 2, subjectCode: 'MATH', topic: 'Analyse', correctOption: 2 },
      { id: 3, subjectCode: 'PHYSICS', topic: 'Ondes', correctOption: 0 },
      { id: 4, subjectCode: 'PHYSICS', topic: 'Électricité', correctOption: 3 }
    ];

    test('Correct (+1), blank (0), and incorrect marks applied accurately', () => {
      // User answers: Q1 correct (+1), Q2 incorrect (0 or negative mark), Q3 blank (0), Q4 correct (+1)
      const userAnswers = {
        1: 1, // correct
        2: 0, // incorrect (correct is 2)
        // 3 is blank
        4: 3  // correct
      };

      const result = mockExamService.calculateAttemptScore(sampleQuestions, userAnswers);

      expect(result.score).toBe(2.0); // 1 + 0 + 0 + 1
      expect(result.totalQuestions).toBe(4);
      expect(result.percentage).toBe(50);

      // Check subject breakdown
      expect(result.scoreBySubject.MATH.total).toBe(2);
      expect(result.scoreBySubject.MATH.correct).toBe(1);
      expect(result.scoreBySubject.PHYSICS.total).toBe(2);
      expect(result.scoreBySubject.PHYSICS.correct).toBe(1);
    });

    test('Weak topics detection flags topics with < 50% accuracy', () => {
      const userAnswers = {
        1: 0, // incorrect
        2: 0, // incorrect -> 'Analyse' accuracy 0%
        3: 0, // correct
        4: 3  // correct -> 'Ondes' 100%, 'Électricité' 100%
      };

      const result = mockExamService.calculateAttemptScore(sampleQuestions, userAnswers);

      expect(result.weakTopics.length).toBe(1);
      expect(result.weakTopics[0].topic).toBe('Analyse');
      expect(result.weakTopics[0].accuracyPercentage).toBe(0);
    });
  });

  describe('Study Plan Schedule Generator', () => {
    test('Spreads topics across weeks and schedules mock exams periodically', () => {
      const concours = { subjects: ['MATH', 'PHYSICS'] };
      const questions = [
        { subjectCode: 'MATH', topic: 'Intégrales' },
        { subjectCode: 'MATH', topic: 'Suites' },
        { subjectCode: 'PHYSICS', topic: 'Nucléaire' },
        { subjectCode: 'PHYSICS', topic: 'Mécanique' }
      ];

      // Exam in 4 weeks
      const examDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      const hoursPerWeek = 6; // 4 sessions of 90 min per week

      const schedule = studyPlanService.generateSchedule({
        concours,
        questions,
        hoursPerWeek,
        examDate,
        weakTopics: ['Intégrales'] // Weak topic should be given more focus
      });

      expect(schedule.length).toBeGreaterThan(0);

      // Verify that mock exams are scheduled
      const mockExamTasks = schedule.filter(t => t.type === 'MOCK_EXAM');
      expect(mockExamTasks.length).toBeGreaterThanOrEqual(1);

      // Verify revision tasks exist
      const revisionTasks = schedule.filter(t => t.type === 'REVISION');
      expect(revisionTasks.length).toBeGreaterThan(0);
    });
  });
});
