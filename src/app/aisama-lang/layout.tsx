import { AuthProvider } from "@/components/aisama-lang/AuthContext";
import { LanguageProvider } from "@/components/aisama-lang/LanguageContext";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "AIsama-lang（アイ様語学）| Language Learning Dashboard",
  description: "Multilingual Narration Learning OS for video creators.",
};

export default function AIsamaLangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </AuthProvider>
  );
}
