"use client";

import { Language } from "@/types/aisama-lang";
import React, { createContext, useContext, useState } from "react";

type LanguageContextType = {
  selectedLang: Language;
  setSelectedLang: (lang: Language) => void;
  activeLanguages: Language[];
  addLanguage: (lang: Language) => void;
  removeLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const DEFAULT_LANGS: Language[] = ["JP", "EN", "ZH", "ES"];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>("EN");
  const [activeLanguages, setActiveLanguages] = useState<Language[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aisama_active_langs");
      return saved ? JSON.parse(saved) : DEFAULT_LANGS;
    }
    return DEFAULT_LANGS;
  });

  const saveLangs = (langs: Language[]) => {
    setActiveLanguages(langs);
    localStorage.setItem("aisama_active_langs", JSON.stringify(langs));
  };

  const addLanguage = (lang: Language) => {
    if (!activeLanguages.includes(lang)) {
      saveLangs([...activeLanguages, lang]);
    }
  };

  const removeLanguage = (lang: Language) => {
    if (activeLanguages.length <= 1) return; // Prevent empty
    const next = activeLanguages.filter((l) => l !== lang);
    saveLangs(next);
    if (selectedLang === lang) {
      setSelectedLang(next[0]);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        selectedLang,
        setSelectedLang,
        activeLanguages,
        addLanguage,
        removeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
