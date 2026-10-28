import prisma from '../../config/prisma.js';
import { notFound, conflict, forbidden } from '../../utils/errors.js';

class ApplicationsService {
  /**
   * Helper to verify application ownership.
   */
  async verifyOwnership(userId, applicationId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const app = await prisma.studentApplication.findUnique({
      where: { id: applicationId },
      include: {
        filiere: {
          include: {
            school: {
              include: {
                requiredDocuments: true,
                applicationProcesses: { orderBy: { closeDate: 'asc' } }
              }
            }
          }
        },
        checklistItems: {
          include: { requiredDocument: true }
        }
      }
    });

    if (!app) {
      throw notFound(`Application with ID ${applicationId} not found`);
    }

    if (app.studentId !== student.id) {
      throw forbidden('You do not have permission to access or modify this application');
    }

    return { student, app };
  }

  /**
   * Create application and auto-generate checklist from school required documents.
   */
  async createApplication(userId, filiereId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: {
        school: {
          include: { requiredDocuments: { orderBy: { order: 'asc' } } }
        }
      }
    });

    if (!filiere) throw notFound(`Filière with ID ${filiereId} not found`);

    const existing = await prisma.studentApplication.findUnique({
      where: {
        studentId_filiereId: {
          studentId: student.id,
          filiereId
        }
      }
    });

    if (existing) {
      throw conflict('An application has already been created for this filière');
    }

    const application = await prisma.$transaction(async (tx) => {
      const createdApp = await tx.studentApplication.create({
        data: {
          studentId: student.id,
          filiereId,
          status: 'DRAFT'
        }
      });

      // Auto-generate checklist items from school required documents
      const docs = filiere.school.requiredDocuments || [];
      for (const doc of docs) {
        await tx.studentChecklistItem.create({
          data: {
            applicationId: createdApp.id,
            requiredDocumentId: doc.id,
            status: 'TODO'
          }
        });
      }

      return createdApp;
    });

    return prisma.studentApplication.findUnique({
      where: { id: application.id },
      include: {
        filiere: { include: { school: true } },
        checklistItems: { include: { requiredDocument: true } }
      }
    });
  }

  /**
   * Get all applications for current student.
   */
  async getApplications(userId) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw notFound('Student not found');

    return prisma.studentApplication.findMany({
      where: { studentId: student.id },
      include: {
        filiere: {
          include: {
            school: {
              select: { id: true, name: true, acronym: true, city: true }
            }
          }
        },
        checklistItems: {
          include: { requiredDocument: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update checklist item status or notes.
   */
  async updateChecklistItem(userId, applicationId, itemId, data) {
    await this.verifyOwnership(userId, applicationId);

    const item = await prisma.studentChecklistItem.findUnique({
      where: { id: itemId }
    });

    if (!item || item.applicationId !== applicationId) {
      throw notFound('Checklist item not found on this application');
    }

    return prisma.studentChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      include: { requiredDocument: true }
    });
  }

  /**
   * Handle document file upload for a checklist item.
   */
  async uploadDocument(userId, applicationId, itemId, file) {
    if (!file) throw notFound('No file uploaded');

    await this.verifyOwnership(userId, applicationId);

    const item = await prisma.studentChecklistItem.findUnique({
      where: { id: itemId }
    });

    if (!item || item.applicationId !== applicationId) {
      throw notFound('Checklist item not found');
    }

    const fileUrl = `/uploads/${file.filename}`;

    return prisma.studentChecklistItem.update({
      where: { id: itemId },
      data: {
        uploadedFileUrl: fileUrl,
        status: 'DONE'
      },
      include: { requiredDocument: true }
    });
  }

  /**
   * Compute application completion progress, next deadline, and missing documents.
   */
  async getProgress(userId, applicationId) {
    const { app } = await this.verifyOwnership(userId, applicationId);

    const items = app.checklistItems || [];
    const totalItems = items.length;
    const doneItems = items.filter(i => i.status === 'DONE').length;
    const progressPercentage = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 100;

    const missingMandatoryDocuments = items
      .filter(i => i.requiredDocument.isMandatory && i.status !== 'DONE')
      .map(i => ({
        itemId: i.id,
        name: i.requiredDocument.name,
        howToObtain: i.requiredDocument.howToObtain,
        status: i.status
      }));

    // Find next upcoming deadline from application processes
    const processes = app.filiere.school.applicationProcesses || [];
    const now = new Date();
    let nextDeadline = null;

    for (const p of processes) {
      if (new Date(p.closeDate) > now) {
        nextDeadline = {
          type: 'APPLICATION_CLOSE',
          date: p.closeDate,
          officialLink: p.officialLink
        };
        break;
      }
      if (p.concoursDate && new Date(p.concoursDate) > now) {
        nextDeadline = {
          type: 'CONCOURS_EXAM',
          date: p.concoursDate,
          officialLink: p.officialLink
        };
        break;
      }
    }

    return {
      applicationId: app.id,
      application: app,
      checklistItems: items,
      filiereName: app.filiere.name,
      schoolName: app.filiere.school.name,
      status: app.status,
      doneItems,
      totalItems,
      progressPercentage,
      progress: {
        totalItems,
        doneItems,
        percentage: progressPercentage,
        isComplete: missingMandatoryDocuments.length === 0
      },
      missingMandatoryDocuments,
      nextDeadline
    };
  }
}

export default new ApplicationsService();
