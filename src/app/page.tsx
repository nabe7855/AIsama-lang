"use client";

import { Dashboard } from "@/components/aisama-lang/Dashboard";
import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}
