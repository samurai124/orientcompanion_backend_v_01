import adminService from './admin.service.js';
import { sendSuccess } from '../../utils/response.js';

class AdminController {
  // --- Schools ---
  async createSchool(req, res, next) {
    try {
      const result = await adminService.createSchool(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateSchool(req, res, next) {
    try {
      const result = await adminService.updateSchool(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteSchool(req, res, next) {
    try {
      await adminService.deleteSchool(req.params.id);
      return sendSuccess(res, { message: 'School deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Filieres ---
  async createFiliere(req, res, next) {
    try {
      const result = await adminService.createFiliere(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateFiliere(req, res, next) {
    try {
      const result = await adminService.updateFiliere(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteFiliere(req, res, next) {
    try {
      await adminService.deleteFiliere(req.params.id);
      return sendSuccess(res, { message: 'Filiere deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Requirements ---
  async createRequirement(req, res, next) {
    try {
      const result = await adminService.createRequirement(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateRequirement(req, res, next) {
    try {
      const result = await adminService.updateRequirement(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteRequirement(req, res, next) {
    try {
      await adminService.deleteRequirement(req.params.id);
      return sendSuccess(res, { message: 'Requirement deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Cutoffs ---
  async createCutoff(req, res, next) {
    try {
      const result = await adminService.createCutoff(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateCutoff(req, res, next) {
    try {
      const result = await adminService.updateCutoff(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteCutoff(req, res, next) {
    try {
      await adminService.deleteCutoff(req.params.id);
      return sendSuccess(res, { message: 'Cutoff deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Documents ---
  async createDocument(req, res, next) {
    try {
      const result = await adminService.createDocument(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateDocument(req, res, next) {
    try {
      const result = await adminService.updateDocument(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      await adminService.deleteDocument(req.params.id);
      return sendSuccess(res, { message: 'Document deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Processes ---
  async createProcess(req, res, next) {
    try {
      const result = await adminService.createProcess(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateProcess(req, res, next) {
    try {
      const result = await adminService.updateProcess(req.params.id, req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteProcess(req, res, next) {
    try {
      await adminService.deleteProcess(req.params.id);
      return sendSuccess(res, { message: 'Process deleted successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Users ---
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const result = await adminService.updateUserStatus(req.params.id, req.body.status);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Stats ---
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      return sendSuccess(res, stats, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new AdminController();
