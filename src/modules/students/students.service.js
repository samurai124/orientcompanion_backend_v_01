import prisma from '../../config/prisma.js';
import { notFound } from '../../utils/errors.js';

class StudentsService {
  /**
   * Helper to fetch student associated with a User ID.
   */
  async getStudentByUserId(userId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    return student;
  }

  /**
   * Update student profile fields.
   */
  async updateProfile(userId, updateData) {
    const student = await this.getStudentByUserId(userId);

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(updateData.bacTrack !== undefined && { bacTrack: updateData.bacTrack }),
        ...(updateData.bacYear !== undefined && { bacYear: updateData.bacYear }),
        ...(updateData.region !== undefined && { region: updateData.region }),
        ...(updateData.stage !== undefined && { stage: updateData.stage }),
        ...(updateData.preferences !== undefined && { preferences: updateData.preferences })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Get all grades for the current student.
   */
  async getGrades(userId) {
    const student = await this.getStudentByUserId(userId);

    return prisma.studentGrade.findMany({
      where: { studentId: student.id },
      orderBy: [{ period: 'asc' }, { subjectCode: 'asc' }]
    });
  }

  /**
   * Bulk upsert grades for the current student.
   */
  async bulkUpsertGrades(userId, grades) {
    const student = await this.getStudentByUserId(userId);

    const operations = grades.map(g =>
      prisma.studentGrade.upsert({
        where: {
          studentId_subjectCode_period: {
            studentId: student.id,
            subjectCode: g.subjectCode.toUpperCase().trim(),
            period: g.period.toUpperCase().trim()
          }
        },
        update: {
          gradeValue: g.gradeValue
        },
        create: {
          studentId: student.id,
          subjectCode: g.subjectCode.toUpperCase().trim(),
          gradeValue: g.gradeValue,
          period: g.period.toUpperCase().trim()
        }
      })
    );

    const results = await prisma.$transaction(operations);
    return results;
  }

  /**
   * Get student details by Student ID (for Counselors & Admins).
   */
  async getStudentById(studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true
          }
        },
        grades: {
          orderBy: [{ period: 'asc' }, { subjectCode: 'asc' }]
        }
      }
    });

    if (!student) {
      throw notFound(`Student with ID ${studentId} not found`);
    }

    return student;
  }
}

export default new StudentsService();
