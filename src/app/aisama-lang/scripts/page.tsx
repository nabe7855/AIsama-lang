"use client";

import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import { ScriptsPage } from "@/components/aisama-lang/ScriptsPage";

export default function AIsamaLangScriptsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ScriptsPage />
      </Layout>
    </ProtectedRoute>
  );
}
