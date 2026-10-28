import authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.body.refreshToken);
      return sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return sendSuccess(res, user, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
