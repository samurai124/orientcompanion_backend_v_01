import gradePlannerService from './gradePlanner.service.js';
import { sendSuccess } from '../../utils/response.js';

class GradePlannerController {
  async createGoal(req, res, next) {
    try {
      const goal = await gradePlannerService.createGoal(req.user.id, req.body.filiereId);
      return sendSuccess(res, goal, 201);
    } catch (error) {
      return next(error);
    }
  }

  async getGoals(req, res, next) {
    try {
      const goals = await gradePlannerService.getGoals(req.user.id);
      return sendSuccess(res, goals, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteGoal(req, res, next) {
    try {
      await gradePlannerService.deleteGoal(req.user.id, req.params.id);
      return sendSuccess(res, { message: 'Grade target goal deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async simulate(req, res, next) {
    try {
      const result = await gradePlannerService.simulateGrades(
        req.body.filiereId,
        req.body.hypotheticalGrades
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new GradePlannerController();
