import applicationsService from './applications.service.js';
import { sendSuccess } from '../../utils/response.js';

class ApplicationsController {
  async createApplication(req, res, next) {
    try {
      const result = await applicationsService.createApplication(req.user.id, req.body.filiereId);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async getApplications(req, res, next) {
    try {
      const result = await applicationsService.getApplications(req.user.id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async updateChecklistItem(req, res, next) {
    try {
      const result = await applicationsService.updateChecklistItem(
        req.user.id,
        req.params.id,
        req.params.itemId,
        req.body
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const result = await applicationsService.uploadDocument(
        req.user.id,
        req.params.id,
        req.params.itemId,
        req.file
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getProgress(req, res, next) {
    try {
      const result = await applicationsService.getProgress(req.user.id, req.params.id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new ApplicationsController();
