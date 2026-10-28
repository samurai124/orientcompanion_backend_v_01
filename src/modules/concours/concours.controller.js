import concoursService from './concours.service.js';
import studyPlanService from './studyPlan.service.js';
import mockExamService from './mockExam.service.js';
import tutorService from './tutor.service.js';
import { sendSuccess } from '../../utils/response.js';

class ConcoursController {
  // --- Public Concours ---
  async getConcoursList(req, res, next) {
    try {
      const list = await concoursService.getConcoursList();
      return sendSuccess(res, list, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getConcoursById(req, res, next) {
    try {
      const concours = await concoursService.getConcoursById(req.params.id);
      return sendSuccess(res, concours, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Admin/Counselor CRUD ---
  async createConcours(req, res, next) {
    try {
      const result = await concoursService.createConcours(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateConcours(req, res, next) {
    try {
      const result = await concoursService.updateConcours(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteConcours(req, res, next) {
    try {
      await concoursService.deleteConcours(req.params.id);
      return sendSuccess(res, { message: 'Concours deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async createQuestion(req, res, next) {
    try {
      const result = await concoursService.createQuestion(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async bulkCreateQuestions(req, res, next) {
    try {
      const result = await concoursService.bulkCreateQuestions(req.body.concoursId, req.body.questions);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async createMockExam(req, res, next) {
    try {
      const result = await concoursService.createMockExam(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  // --- Question Bank ---
  async getQuestionBank(req, res, next) {
    try {
      const result = await mockExamService.getQuestionBank(req.query);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Mock Exams (Premium) ---
  async startMockExam(req, res, next) {
    try {
      const session = await mockExamService.startMockExam(req.user.id, req.params.id);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async submitMockExam(req, res, next) {
    try {
      const results = await mockExamService.submitMockExam(req.user.id, req.params.id, req.body.answers);
      return sendSuccess(res, results, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getMyAttempts(req, res, next) {
    try {
      const attempts = await mockExamService.getMyAttempts(req.user.id);
      return sendSuccess(res, attempts, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Study Plans (Premium) ---
  async createStudyPlan(req, res, next) {
    try {
      const plan = await studyPlanService.createStudyPlan(req.user.id, req.body);
      return sendSuccess(res, plan, 201);
    } catch (error) {
      return next(error);
    }
  }

  async getMyStudyPlans(req, res, next) {
    try {
      const plans = await studyPlanService.getMyStudyPlans(req.user.id);
      return sendSuccess(res, plans, 200);
    } catch (error) {
      return next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const updated = await studyPlanService.updateTaskStatus(req.user.id, req.params.id, req.body.status);
      return sendSuccess(res, updated, 200);
    } catch (error) {
      return next(error);
    }
  }

  async regenerateStudyPlan(req, res, next) {
    try {
      const regenerated = await studyPlanService.regeneratePlan(req.user.id, req.params.id);
      return sendSuccess(res, regenerated, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- AI Tutor (Premium) ---
  async askTutor(req, res, next) {
    try {
      const answer = await tutorService.askTutor(req.user.id, req.body);
      return sendSuccess(res, answer, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new ConcoursController();
