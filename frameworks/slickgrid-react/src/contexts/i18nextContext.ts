import React from 'react';
import type { I18Next } from '../models/i18next.interface.js';

export const I18nextContext = React.createContext<I18Next | null>(null);

export const I18nextProvider = I18nextContext.Provider;
export const useI18next = () => React.useContext(I18nextContext);
