import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  function createContext(): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows access for public routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('delegates to passport auth guard for protected routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const passportCanActivate = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(true);

    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(passportCanActivate).toHaveBeenCalled();
  });
});
