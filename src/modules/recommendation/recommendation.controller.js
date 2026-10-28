import recommendationService from './recommendation.service.js';
import { sendSuccess } from '../../utils/response.js';

class RecommendationController {
  async generate(req, res, next) {
    try {
      const recommendations = await recommendationService.generateRecommendations(req.user.id);
      return sendSuccess(res, recommendations, 201);
    } catch (error) {
      return next(error);
    }
  }

  async getMyRecommendations(req, res, next) {
    try {
      const recommendations = await recommendationService.getRecommendationsByUserId(req.user.id);
      return sendSuccess(res, recommendations, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new RecommendationController();
