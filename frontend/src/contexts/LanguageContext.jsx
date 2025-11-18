import { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  const switchToEnglish = () => switchLanguage('en');
  const switchToGreek = () => switchLanguage('gr');

  return (
    <LanguageContext.Provider
      value={{
        language,
        switchLanguage,
        switchToEnglish,
        switchToGreek,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
