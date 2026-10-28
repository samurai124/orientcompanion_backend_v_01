import prisma from '../../config/prisma.js';
import { notFound } from '../../utils/errors.js';

class ConcoursService {
  // --- Public Endpoints ---
  async getConcoursList() {
    return prisma.concours.findMany({
      include: {
        mockExams: true,
        _count: {
          select: { questions: true, mockExams: true }
        }
      },
      orderBy: { examDate: 'asc' }
    });
  }

  async getConcoursById(id) {
    const concours = await prisma.concours.findUnique({
      where: { id },
      include: {
        mockExams: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!concours) {
      throw notFound(`Concours with ID ${id} not found`);
    }

    return concours;
  }

  // --- Admin/Counselor CRUD ---
  async createConcours(data) {
    return prisma.concours.create({ data });
  }

  async updateConcours(id, data) {
    return prisma.concours.update({ where: { id }, data });
  }

  async deleteConcours(id) {
    return prisma.concours.delete({ where: { id } });
  }

  async createQuestion(data) {
    return prisma.question.create({ data });
  }

  async bulkCreateQuestions(concoursId, questions) {
    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) throw notFound(`Concours with ID ${concoursId} not found`);

    const operations = questions.map(q =>
      prisma.question.create({
        data: {
          concoursId,
          subjectCode: q.subjectCode,
          topic: q.topic,
          difficulty: q.difficulty,
          statement: q.statement,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation
        }
      })
    );

    const created = await prisma.$transaction(operations);
    return {
      count: created.length,
      questions: created
    };
  }

  async createMockExam(data) {
    return prisma.mockExam.create({ data });
  }

  async updateMockExam(id, data) {
    return prisma.mockExam.update({ where: { id }, data });
  }
}

export default new ConcoursService();
