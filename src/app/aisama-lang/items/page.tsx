import { ItemsPage } from "@/components/aisama-lang/ItemsPage";
import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";

export default function AIsamaLangItemsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ItemsPage />
      </Layout>
    </ProtectedRoute>
  );
}
