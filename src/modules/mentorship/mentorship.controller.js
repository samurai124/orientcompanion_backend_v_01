import mentorshipService from './mentorship.service.js';
import { sendSuccess } from '../../utils/response.js';

class MentorshipController {
  async requestSession(req, res, next) {
    try {
      const session = await mentorshipService.requestSession(req.user.id, req.body);
      return sendSuccess(res, session, 201);
    } catch (error) {
      return next(error);
    }
  }

  async acceptSession(req, res, next) {
    try {
      const session = await mentorshipService.acceptSession(req.user, req.params.id);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async rejectSession(req, res, next) {
    try {
      const session = await mentorshipService.rejectSession(req.user, req.params.id);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async cancelSession(req, res, next) {
    try {
      const session = await mentorshipService.cancelSession(req.user, req.params.id);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async completeSession(req, res, next) {
    try {
      const session = await mentorshipService.completeSession(req.user, req.params.id, req.body.report);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async rateSession(req, res, next) {
    try {
      const session = await mentorshipService.rateSession(req.user.id, req.params.id, req.body.rating);
      return sendSuccess(res, session, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getMySessions(req, res, next) {
    try {
      const sessions = await mentorshipService.getMySessions(req.user);
      return sendSuccess(res, sessions, 200);
    } catch (error) {
      return next(error);
    }
  }

  // --- Counselor Availability ---
  async getAvailability(req, res, next) {
    try {
      const slots = await mentorshipService.getAvailability(req.user.id);
      return sendSuccess(res, slots, 200);
    } catch (error) {
      return next(error);
    }
  }

  async addAvailability(req, res, next) {
    try {
      const slot = await mentorshipService.addAvailability(req.user.id, req.body);
      return sendSuccess(res, slot, 201);
    } catch (error) {
      return next(error);
    }
  }

  async deleteAvailability(req, res, next) {
    try {
      await mentorshipService.deleteAvailability(req.user.id, req.params.id);
      return sendSuccess(res, { message: 'Availability slot deleted' }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getCounselors(req, res, next) {
    try {
      const counselors = await mentorshipService.getCounselors();
      return sendSuccess(res, counselors, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new MentorshipController();
