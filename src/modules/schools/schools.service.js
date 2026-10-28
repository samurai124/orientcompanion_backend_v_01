import prisma from '../../config/prisma.js';
import { notFound } from '../../utils/errors.js';
import { getPaginationParams, formatPaginatedResponse } from '../../utils/pagination.js';

class SchoolsService {
  /**
   * List schools with optional filters and pagination.
   */
  async getSchools(query) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where = {};

    if (query.city) {
      where.city = { contains: query.city };
    }
    if (query.region) {
      where.region = { contains: query.region };
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { acronym: { contains: query.search } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { filieres: true }
          }
        }
      }),
      prisma.school.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get single school by ID with related filieres, documents and application processes.
   */
  async getSchoolById(id) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        filieres: {
          select: {
            id: true,
            name: true,
            level: true,
            requiredBacTracks: true,
            tags: true
          }
        },
        requiredDocuments: {
          orderBy: { order: 'asc' }
        },
        applicationProcesses: {
          orderBy: { year: 'desc' }
        }
      }
    });

    if (!school) {
      throw notFound(`School with ID ${id} not found`);
    }

    return school;
  }

  /**
   * List filieres with filtering by school, city, bacTrack, etc.
   */
  async getFilieres(query) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where = {};

    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }
    if (query.level) {
      where.level = query.level;
    }
    if (query.city) {
      where.school = { city: { contains: query.city } };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { school: { name: { contains: query.search } } },
        { school: { acronym: { contains: query.search } } }
      ];
    }

    const [allMatching, total] = await Promise.all([
      prisma.filiere.findMany({
        where,
        skip,
        take,
        include: {
          school: {
            select: { id: true, name: true, acronym: true, city: true, type: true }
          },
          admissionRequirements: {
            orderBy: { year: 'desc' },
            take: 1
          },
          historicalCutoffs: {
            orderBy: { year: 'desc' },
            take: 3
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.filiere.count({ where })
    ]);

    // In-memory filter for bacTrack if specified (since requiredBacTracks is JSON)
    let filteredItems = allMatching;
    if (query.bacTrack) {
      const targetTrack = query.bacTrack.toUpperCase();
      filteredItems = allMatching.filter(f => {
        const tracks = Array.isArray(f.requiredBacTracks) ? f.requiredBacTracks : [];
        return tracks.includes(targetTrack);
      });
    }

    return formatPaginatedResponse(filteredItems, total, page, limit);
  }

  /**
   * Get single filière by ID.
   */
  async getFiliereById(id) {
    const filiere = await prisma.filiere.findUnique({
      where: { id },
      include: {
        school: true,
        admissionRequirements: {
          orderBy: { year: 'desc' }
        },
        historicalCutoffs: {
          orderBy: { year: 'desc' }
        }
      }
    });

    if (!filiere) {
      throw notFound(`Filière with ID ${id} not found`);
    }

    return filiere;
  }

  /**
   * Get admission requirements, required documents, and process steps for a school.
   */
  async getSchoolRequirements(schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        requiredDocuments: {
          orderBy: { order: 'asc' }
        },
        applicationProcesses: {
          orderBy: { year: 'desc' }
        }
      }
    });

    if (!school) {
      throw notFound(`School with ID ${schoolId} not found`);
    }

    return {
      schoolId: school.id,
      schoolName: school.name,
      acronym: school.acronym,
      requiredDocuments: school.requiredDocuments,
      applicationProcesses: school.applicationProcesses
    };
  }
}

export default new SchoolsService();
