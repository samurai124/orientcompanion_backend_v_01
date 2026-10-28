import studentsService from './students.service.js';
import { sendSuccess } from '../../utils/response.js';

class StudentsController {
  async getMe(req, res, next) {
    try {
      const student = await studentsService.getStudentByUserId(req.user.id);
      return sendSuccess(res, student, 200);
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const updated = await studentsService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getGrades(req, res, next) {
    try {
      const grades = await studentsService.getGrades(req.user.id);
      return sendSuccess(res, grades, 200);
    } catch (error) {
      return next(error);
    }
  }

  async upsertGrades(req, res, next) {
    try {
      const grades = await studentsService.bulkUpsertGrades(req.user.id, req.body.grades);
      return sendSuccess(res, grades, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getStudentById(req, res, next) {
    try {
      const student = await studentsService.getStudentById(req.params.id);
      return sendSuccess(res, student, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new StudentsController();
