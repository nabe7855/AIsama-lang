import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import { VideoDetail } from "@/components/aisama-lang/VideoDetail";

export default function AIsamaLangVideoDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <VideoDetail />
      </Layout>
    </ProtectedRoute>
  );
}
