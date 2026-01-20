import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Download,
  RefreshCw,
  ArrowLeft,
  Lightbulb,
  Users,
  Brain,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: study } = trpc.study.getById.useQuery(
    { id: studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: report, isLoading, refetch } = trpc.report.getByStudy.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const generateReportMutation = trpc.report.generate.useMutation({
    onSuccess: () => {
      toast.success("Report generated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate report");
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
              <h1 className="text-3xl font-bold mb-4">Sign in to view report</h1>
              <a href={getLoginUrl()}>
                <Button className="btn-neon">Sign In</Button>
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/studies/${studyId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Study
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Research Report</h1>
                <p className="text-muted-foreground">{study?.title}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateReportMutation.mutate({ studyId })}
                  disabled={generateReportMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${generateReportMutation.isPending ? "animate-spin" : ""}`} />
                  {report ? "Regenerate" : "Generate"}
                </Button>
                {report && (
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </div>

          {report ? (
            <div className="space-y-8">
              {/* Executive Summary */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Executive Summary</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <Streamdown>{report.executiveSummary || "No summary available"}</Streamdown>
                </div>
              </div>

              {/* Key Findings */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Key Findings</h2>
                </div>
                <ul className="space-y-3">
                  {(report.keyFindings as any || []).map((finding: any, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium mb-1">{finding.title}</p>
                        <p className="text-muted-foreground text-sm">{finding.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audience Insights */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Audience Insights</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <Streamdown>{JSON.stringify(report.audienceInsights, null, 2)}</Streamdown>
                </div>
              </div>

              {/* Behavioral Analysis */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Behavioral Analysis</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <Streamdown>{JSON.stringify(report.behavioralAnalysis, null, 2)}</Streamdown>
                </div>
              </div>

              {/* Recommendations */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Recommendations</h2>
                </div>
                <ul className="space-y-3">
                  {(report.recommendations as any || []).map((rec: any, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-xs text-green-400 shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium mb-1">{rec.recommendation}</p>
                        <p className="text-muted-foreground text-sm">{rec.rationale}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No report generated yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate a comprehensive research report based on your AI persona interviews.
              </p>
              <Button
                className="btn-neon gap-2"
                onClick={() => generateReportMutation.mutate({ studyId })}
                disabled={generateReportMutation.isPending}
              >
                {generateReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
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
