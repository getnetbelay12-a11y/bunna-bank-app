import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function createContext(user?: { role: UserRole }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when the user has the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('rejects access when the user context is missing', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it('rejects access when the user role does not match', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.MEMBER })),
    ).toThrow(ForbiddenException);
  });
});
