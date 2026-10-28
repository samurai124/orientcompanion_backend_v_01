import chatbotService from './chatbot.service.js';
import { sendSuccess } from '../../utils/response.js';

class ChatbotController {
  async sendMessage(req, res, next) {
    try {
      const response = await chatbotService.processMessage(req.user.id, req.body);
      return sendSuccess(res, response, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new ChatbotController();
