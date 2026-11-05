import React, { createContext, useContext, useState, useCallback } from 'react';

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (US)' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
];

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    settings: 'Settings',
    general: 'General',
    notifications: 'Notifications',
    theme: 'Theme',
    displayTheme: 'Display Theme',
    themeSubtitle: 'Choose how BCC Teams looks on your device.',
    light: 'Light',
    dark: 'Dark',
    highContrast: 'High Contrast',
    systemDefault: 'System default',
    language: 'Language',
    languageSubtitle: 'Select your preferred application display language.',
    appLanguage: 'App Language',
    notificationPreferences: 'Notification Preferences',
    notificationSubtitle: 'Configure alert sounds, popups, and email digests.',
    bannerToasts: 'Banner pop-up toasts',
    bannerToastsDesc: 'Display desktop notification banners for direct mentions and replies',
    soundAlerts: 'Sound alerts',
    soundAlertsDesc: 'Play audio chimes for incoming messages and call rings',
    emailDigest: 'Missed activity email digest',
    emailDigestDesc: 'Receive periodic email summaries of missed mentions and chats',
    done: 'Done',
    closeSettings: 'Close settings',
  },
  fr: {
    settings: 'Paramètres',
    general: 'Général',
    notifications: 'Notifications',
    theme: 'Thème',
    displayTheme: 'Thème d’affichage',
    themeSubtitle: 'Choisissez l’apparence de BCC Teams sur votre appareil.',
    light: 'Clair',
    dark: 'Sombre',
    highContrast: 'Contraste élevé',
    systemDefault: 'Par défaut du système',
    language: 'Langue',
    languageSubtitle: 'Sélectionnez la langue d’affichage de votre application.',
    appLanguage: 'Langue de l’application',
    notificationPreferences: 'Préférences de notification',
    notificationSubtitle: 'Configurez les alertes sonores, bannières et résumés.',
    bannerToasts: 'Bannières de notification',
    bannerToastsDesc: 'Afficher des bannières pour les mentions directes et réponses',
    soundAlerts: 'Alertes sonores',
    soundAlertsDesc: 'Émettre un signal sonore pour les nouveaux messages et appels',
    emailDigest: 'Résumé par e-mail des activités manquées',
    emailDigestDesc: 'Recevoir un récapitulatif par e-mail des mentions manquées',
    done: 'Terminer',
    closeSettings: 'Fermer les paramètres',
  },
  es: {
    settings: 'Configuración',
    general: 'General',
    notifications: 'Notificaciones',
    theme: 'Tema',
    displayTheme: 'Tema de visualización',
    themeSubtitle: 'Elige el aspecto visual de BCC Teams en tu dispositivo.',
    light: 'Claro',
    dark: 'Oscuro',
    highContrast: 'Alto contraste',
    systemDefault: 'Predeterminado del sistema',
    language: 'Idioma',
    languageSubtitle: 'Selecciona tu idioma preferido para la aplicación.',
    appLanguage: 'Idioma de la aplicación',
    notificationPreferences: 'Preferencias de notificaciones',
    notificationSubtitle: 'Configura avisos sonoros, ventanas emergentes y resúmenes.',
    bannerToasts: 'Banners emergentes',
    bannerToastsDesc: 'Mostrar avisos en pantalla para menciones directas y respuestas',
    soundAlerts: 'Alertas de sonido',
    soundAlertsDesc: 'Reproducir sonido al recibir mensajes y llamadas',
    emailDigest: 'Resumen por correo de actividad perdida',
    emailDigestDesc: 'Recibir resúmenes por correo de menciones no leídas',
    done: 'Listo',
    closeSettings: 'Cerrar configuración',
  },
  de: {
    settings: 'Einstellungen',
    general: 'Allgemein',
    notifications: 'Benachrichtigungen',
    theme: 'Design',
    displayTheme: 'Anzeigedesign',
    themeSubtitle: 'Wählen Sie das Erscheinungsbild von BCC Teams auf Ihrem Gerät.',
    light: 'Hell',
    dark: 'Dunkel',
    highContrast: 'Hoher Kontrast',
    systemDefault: 'Systemstandard',
    language: 'Sprache',
    languageSubtitle: 'Wählen Sie Ihre bevorzugte Anzeigesprache.',
    appLanguage: 'App-Sprache',
    notificationPreferences: 'Benachrichtigungseinstellungen',
    notificationSubtitle: 'Töne, Banner und E-Mail-Zusammenfassungen anpassen.',
    bannerToasts: 'Banner-Benachrichtigungen',
    bannerToastsDesc: 'Desktop-Banner für direkte Erwähnungen und Antworten anzeigen',
    soundAlerts: 'Tonsignale',
    soundAlertsDesc: 'Audiosignale für eingehende Nachrichten und Anrufe abspielen',
    emailDigest: 'E-Mail-Zusammenfassung verpasster Aktivitäten',
    emailDigestDesc: 'Regelmäßige E-Mail-Berichte über ungelesene Erwähnungen',
    done: 'Fertig',
    closeSettings: 'Einstellungen schließen',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('bcc_language') as SupportedLanguage | null;
    return saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'de' ? saved : 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bcc_language', lang);
  }, []);

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

