"use client"; // Ce fichier sera un composant client

import React from 'react';
import './i18n'; // On déplace l'import d'i18n ICI

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}