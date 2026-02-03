import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import { VideoNew } from "@/components/aisama-lang/VideoNew";

export default function AIsamaLangNewVideoPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <VideoNew />
      </Layout>
    </ProtectedRoute>
  );
}
