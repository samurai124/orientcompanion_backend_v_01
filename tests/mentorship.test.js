import { transition } from '../src/modules/mentorship/mentorship.service.js';
import { AppError } from '../src/utils/errors.js';

describe('Mentorship Session State Machine Transitions', () => {
  test('Counselor accepts REQUESTED session -> transitions to SCHEDULED', () => {
    const nextStatus = transition('REQUESTED', 'SCHEDULED', 'COUNSELOR');
    expect(nextStatus).toBe('SCHEDULED');
  });

  test('Counselor rejects REQUESTED session -> transitions to REJECTED', () => {
    const nextStatus = transition('REQUESTED', 'REJECTED', 'COUNSELOR');
    expect(nextStatus).toBe('REJECTED');
  });

  test('Student cancels REQUESTED session -> transitions to CANCELLED', () => {
    const nextStatus = transition('REQUESTED', 'CANCELLED', 'STUDENT');
    expect(nextStatus).toBe('CANCELLED');
  });

  test('Student cancels SCHEDULED session -> transitions to CANCELLED', () => {
    const nextStatus = transition('SCHEDULED', 'CANCELLED', 'STUDENT');
    expect(nextStatus).toBe('CANCELLED');
  });

  test('Counselor marks SCHEDULED session as COMPLETED -> transitions to COMPLETED', () => {
    const nextStatus = transition('SCHEDULED', 'COMPLETED', 'COUNSELOR');
    expect(nextStatus).toBe('COMPLETED');
  });

  test('Student attempting to accept or complete a session throws 409 CONFLICT', () => {
    expect(() => {
      transition('REQUESTED', 'SCHEDULED', 'STUDENT');
    }).toThrow(AppError);

    try {
      transition('REQUESTED', 'SCHEDULED', 'STUDENT');
    } catch (err) {
      expect(err.status).toBe(409);
      expect(err.code).toBe('CONFLICT');
    }

    expect(() => {
      transition('SCHEDULED', 'COMPLETED', 'STUDENT');
    }).toThrow(AppError);
  });

  test('Transition from terminal state COMPLETED throws 409 CONFLICT', () => {
    expect(() => {
      transition('COMPLETED', 'SCHEDULED', 'COUNSELOR');
    }).toThrow(AppError);

    expect(() => {
      transition('COMPLETED', 'CANCELLED', 'STUDENT');
    }).toThrow(AppError);
  });

  test('Transition from terminal state CANCELLED throws 409 CONFLICT', () => {
    expect(() => {
      transition('CANCELLED', 'SCHEDULED', 'COUNSELOR');
    }).toThrow(AppError);
  });
});
