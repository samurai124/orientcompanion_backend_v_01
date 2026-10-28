import nodemailer from 'nodemailer';
import env from '../config/env.js';

class MailerService {
  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    } else {
      // In development / test or without credentials, log emails to console
      this.transporter = {
        sendMail: async (mailOptions) => {
          if (env.NODE_ENV !== 'test') {
            console.log('\n📧 [Nodemailer Console Transport]');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Body: ${mailOptions.text || mailOptions.html}`);
            console.log('-------------------------------------\n');
          }
          return { messageId: `mock-${Date.now()}` };
        }
      };
    }
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html: html || text
      });
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return null;
    }
  }
}

export default new MailerService();
