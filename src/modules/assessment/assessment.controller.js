import assessmentService from './assessment.service.js';
import { sendSuccess } from '../../utils/response.js';

class AssessmentController {
  getQuestionnaire(req, res, next) {
    try {
      const questionnaire = assessmentService.getQuestionnaire();
      return sendSuccess(res, questionnaire, 200);
    } catch (error) {
      return next(error);
    }
  }

  async submitAssessment(req, res, next) {
    try {
      const result = await assessmentService.submitAssessment(req.user.id, req.body.answers);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new AssessmentController();
