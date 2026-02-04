import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  Users,
  MessageSquare,
  FileText,
  ArrowRight,
  Sparkles,
  Brain,
  RefreshCw,
} from "lucide-react";
import { PersonaCard } from "@/components/PersonaCard";
import { toast } from "sonner";

export default function StudyDetail() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: study, isLoading, refetch } = trpc.study.getById.useQuery(
    { id: studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: personas } = trpc.persona.listByStudy.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const generatePersonasMutation = trpc.persona.generate.useMutation({
    onSuccess: () => {
      toast.success("Personas generated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate personas");
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
              <h1 className="text-3xl font-bold mb-4">Sign in to view study</h1>
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

  if (!study) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Study not found</h1>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
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
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">{study.title}</h1>
            <p className="text-muted-foreground">{study.description}</p>
          </div>

          {/* Workflow Guide */}
          <div className="flex items-center justify-center gap-4 mb-8">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
               <span className="text-sm font-medium">生成画像</span>
             </div>
             <div className="w-12 h-px bg-border" />
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
               <span className="text-sm font-medium">开展访谈</span>
             </div>
             <div className="w-12 h-px bg-border" />
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
               <span className="text-sm font-medium">生成报告</span>
             </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Personas Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Personas</h3>
                  <p className="text-sm text-muted-foreground">
                    {personas?.length || 0} generated
                  </p>
                </div>
              </div>
              <div className="min-h-[80px]">
                {personas && personas.length > 0 ? (
                  <div className="space-y-2">
                    {personas.slice(0, 3).map((persona: any) => (
                      <div key={persona.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {persona.name?.charAt(0) || "P"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{persona.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {persona.age} · {persona.occupation}
                          </p>
                        </div>
                      </div>
                    ))}
                    {personas.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{personas.length - 3} more personas
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full btn-neon gap-2"
                    onClick={() => generatePersonasMutation.mutate({ studyId })}
                    disabled={generatePersonasMutation.isPending}
                  >
                    {generatePersonasMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Personas
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Auto Interview Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold">AI 自动调研</h3>
                  <p className="text-sm text-muted-foreground">
                    AI 智能体自主访谈所有受访者
                  </p>
                </div>
              </div>
              <Link href={`/studies/${studyId}/auto-interview`}>
                <Button
                  className="w-full btn-neon gap-2"
                  disabled={!personas || personas.length === 0}
                >
                  <Sparkles className="w-4 h-4" />
                  开始自动调研
                </Button>
              </Link>
            </div>

            {/* Manual Interviews Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">手动访谈</h3>
                  <p className="text-sm text-muted-foreground">
                    与 AI 受访者进行对话
                  </p>
                </div>
              </div>
              <Link href={`/studies/${studyId}/interview`}>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!personas || personas.length === 0}
                >
                  开始访谈
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Report Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold">记录&报告</h3>
                  <p className="text-sm text-muted-foreground">
                    查看访谈记录或生成深度报告
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/studies/${studyId}/interviews`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    访谈记录
                  </Button>
                </Link>
                <Link href={`/studies/${studyId}/deep-report`} className="flex-1">
                  <Button className="w-full btn-neon gap-2">
                    深度报告
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Persona Preview Section */}
          {personas && personas.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">AI 受访者画像</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona: any) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    onStartInterview={() => {
                      window.location.href = `/studies/${studyId}/interview?personaId=${persona.id}`;
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Study Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Research Objective
              </h3>
              <p className="text-muted-foreground">{study.researchObjective || "No objective specified"}</p>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Target Audience
              </h3>
              <p className="text-muted-foreground">{study.targetAudience || "No target audience specified"}</p>
            </div>

            <div className="glass-card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Research Questions</h3>
              <ul className="space-y-2">
                {(study.researchQuestions as string[] || []).map((question: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
