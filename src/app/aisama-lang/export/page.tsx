"use client";

import { ExportPage } from "@/components/aisama-lang/ExportPage";
import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";

export default function AIsamaLangExportPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ExportPage />
      </Layout>
    </ProtectedRoute>
  );
}
