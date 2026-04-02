import { createContext, useContext } from 'react';

import type { AppClient } from '../core/api/appClient';

export const AppClientContext = createContext<AppClient | null>(null);

export function useAppClient(): AppClient {
  const value = useContext(AppClientContext);

  if (!value) {
    throw new Error('AppClientContext is not available.');
  }

  return value;
}
