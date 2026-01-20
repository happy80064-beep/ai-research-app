import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, RefreshCw, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { DeepReportView } from "@/components/DeepReportView";
import "@/styles/deep-report.css";

export default function DeepReport() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: study } = trpc.study.getById.useQuery(
    { id: studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: personas } = trpc.persona.listByStudy.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: deepReport, isLoading, refetch } = trpc.report.getDeepReport.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const generateDeepReportMutation = trpc.report.generateDeep.useMutation({
    onSuccess: () => {
      toast.success("深度报告生成成功！");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "深度报告生成失败");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">请登录查看深度报告</h1>
              <a href={getLoginUrl()}>
                <Button className="btn-neon">登录</Button>
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="container max-w-7xl">
          {/* Header Actions */}
          <div className="mb-8 flex items-center justify-between report-actions">
            <Link href={`/studies/${studyId}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              返回调研详情
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => generateDeepReportMutation.mutate({ studyId })}
                disabled={generateDeepReportMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generateDeepReportMutation.isPending ? "animate-spin" : ""}`} />
                {deepReport ? "重新生成" : "生成深度报告"}
              </Button>
              {deepReport && (
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Download className="w-4 h-4" />
                  导出 PDF
                </Button>
              )}
            </div>
          </div>

          {deepReport ? (
            <DeepReportView
              data={deepReport.content as any}
              reportDate={new Date(deepReport.createdAt).toLocaleDateString()}
              intervieweeCount={personas?.length || 0}
              interviewCount={personas?.length || 0}
            />
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">还未生成深度报告</h3>
              <p className="text-muted-foreground mb-6">
                基于所有访谈数据生成 McKinsey 式专业深度分析报告
              </p>
              <Button
                className="btn-neon gap-2"
                onClick={() => generateDeepReportMutation.mutate({ studyId })}
                disabled={generateDeepReportMutation.isPending}
              >
                {generateDeepReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    生成深度报告
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
