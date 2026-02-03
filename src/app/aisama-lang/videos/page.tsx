import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import { VideoList } from "@/components/aisama-lang/VideoList";

export default function AIsamaLangVideosPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <VideoList />
      </Layout>
    </ProtectedRoute>
  );
}
