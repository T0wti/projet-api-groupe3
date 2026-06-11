"use client";

import './i18n';
import React from 'react';
// 1. On importe explicitement l'instance configurée depuis ton fichier
import i18n from './i18n'; 
import { I18nextProvider } from 'react-i18next'; // 2. On importe le composant de contexte officiel

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    // 3. On entoure toute l'application avec l'instance i18n injectée de force
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}