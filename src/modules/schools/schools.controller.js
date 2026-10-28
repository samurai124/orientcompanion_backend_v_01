import schoolsService from './schools.service.js';
import { sendSuccess } from '../../utils/response.js';

class SchoolsController {
  async getSchools(req, res, next) {
    try {
      const result = await schoolsService.getSchools(req.query);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getSchoolById(req, res, next) {
    try {
      const school = await schoolsService.getSchoolById(req.params.id);
      return sendSuccess(res, school, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getFilieres(req, res, next) {
    try {
      const result = await schoolsService.getFilieres(req.query);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getFiliereById(req, res, next) {
    try {
      const filiere = await schoolsService.getFiliereById(req.params.id);
      return sendSuccess(res, filiere, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getSchoolRequirements(req, res, next) {
    try {
      const requirements = await schoolsService.getSchoolRequirements(req.params.id);
      return sendSuccess(res, requirements, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new SchoolsController();
