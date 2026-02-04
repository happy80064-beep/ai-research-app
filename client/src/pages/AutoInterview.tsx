import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThinkingStep } from "@/components/ThinkingProcess";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Play, CheckCircle2, Loader2, Brain } from "lucide-react";
import { Streamdown } from "streamdown";

interface InterviewRound {
  question: string;
  response: string;
  jtbd_insight: string;
  next_question_rationale: string;
}

interface InterviewTranscript {
  rounds: InterviewRound[];
  summary: {
    key_job_stories: string[];
    pain_points: string[];
    emotional_triggers: string[];
    decision_factors: string[];
  };
}

export default function AutoInterview() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const [, setLocation] = useLocation();

  const [isRunning, setIsRunning] = useState(false);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState<InterviewTranscript | null>(null);
  const [completedPersonas, setCompletedPersonas] = useState<string[]>([]);

  const { data: study } = trpc.study.getById.useQuery({ id: studyId });
  const { data: personas } = trpc.persona.listByStudy.useQuery({ studyId });
  const { data: progress } = trpc.autoInterview.getProgress.useQuery({ studyId });

  const startInterview = trpc.autoInterview.start.useMutation({
    onSuccess: () => {
      setIsRunning(true);
      setCurrentPersonaIndex(0);
      conductNextInterview();
    },
    onError: (error) => {
      toast.error(`启动失败：${error.message}`);
    },
  });

  const interviewPersona = trpc.autoInterview.interviewPersona.useMutation({
    onSuccess: (data) => {
      setCurrentTranscript(data.transcript);
      setCompletedPersonas(prev => [...prev, data.personaName]);
      
      // Wait 2 seconds before moving to next persona
      setTimeout(() => {
        if (personas && currentPersonaIndex < personas.length - 1) {
          setCurrentPersonaIndex(prev => prev + 1);
          conductNextInterview();
        } else {
          setIsRunning(false);
          toast.success("所有访谈已完成！");
        }
      }, 2000);
    },
    onError: (error) => {
      toast.error(`访谈失败：${error.message}`);
      setIsRunning(false);
    },
  });

  const conductNextInterview = () => {
    if (!personas || currentPersonaIndex >= personas.length) return;
    
    const persona = personas[currentPersonaIndex];
    setCurrentTranscript(null);
    
    interviewPersona.mutate({
      studyId,
      personaId: persona.id,
    });
  };

  const handleStart = () => {
    startInterview.mutate({ studyId });
  };

  const progressPercentage = personas ? (completedPersonas.length / personas.length) * 100 : 0;
  const currentPersona = personas?.[currentPersonaIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/studies/${studyId}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回调研详情
            </Button>

            {!isRunning && completedPersonas.length === 0 && (
              <Button onClick={handleStart} className="btn-neon gap-2">
                <Play className="w-4 h-4" />
                开始自动化调研
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar - Progress */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">调研进度</h3>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {completedPersonas.length} / {personas?.length || 0} 位受访者已完成
                  </p>
                </div>

                <div className="space-y-3">
                  {personas?.map((persona, index) => (
                    <div
                      key={persona.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        index === currentPersonaIndex && isRunning
                          ? "border-primary bg-primary/5"
                          : completedPersonas.includes(persona.name)
                          ? "border-primary/30 bg-accent/30"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {completedPersonas.includes(persona.name) ? (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : index === currentPersonaIndex && isRunning ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{persona.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {persona.age}岁 · {persona.occupation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {study && (
                <Card className="glass-card p-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    研究框架
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><span className="font-semibold">方法：</span>JTBD (Jobs-to-be-Done)</p>
                    <p><span className="font-semibold">目标：</span>{study.researchObjective}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right main area - Interview transcript */}
            <div className="lg:col-span-2">
              <Card className="glass-card p-6">
                {!isRunning && completedPersonas.length === 0 && (
                  <div className="text-center py-16">
                    <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">准备开始自动化调研</h3>
                    <p className="text-muted-foreground mb-6">
                      AI 智能体将自动对所有受访者进行深度访谈
                    </p>
                    <Button onClick={handleStart} className="btn-neon gap-2">
                      <Play className="w-4 h-4" />
                      开始访谈
                    </Button>
                  </div>
                )}

                {isRunning && !currentTranscript && (
                  <div className="text-center py-16">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      正在访谈：{currentPersona?.name}
                    </h3>
                    <p className="text-muted-foreground">
                      AI 智能体正在进行深度访谈...
                    </p>
                  </div>
                )}

                {currentTranscript && currentPersona && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        访谈：{currentPersona.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {currentPersona.age}岁 · {currentPersona.gender} · {currentPersona.occupation}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">访谈过程</h3>
                      {(currentTranscript.rounds || []).map((round, index) => (
                        <div key={index} className="space-y-3">
                          <div className="bg-accent/30 rounded-xl p-4">
                            <p className="text-xs font-semibold text-primary mb-2">
                              调研员提问 #{index + 1}
                            </p>
                            <p className="text-sm">{round.question}</p>
                          </div>

                          <div className="bg-primary/5 rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              {currentPersona.name} 的回答
                            </p>
                            <div className="text-sm">
                              <Streamdown>{round.response}</Streamdown>
                            </div>
                          </div>

                          <div className="bg-accent/20 rounded-xl p-4 border-l-4 border-l-primary">
                            <p className="text-xs font-semibold text-primary mb-2">
                              JTBD 洞察
                            </p>
                            <p className="text-sm text-muted-foreground italic">
                              {round.jtbd_insight}
                            </p>
                          </div>

                          {round.next_question_rationale && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground">
                                查看下一个问题的思考逻辑
                              </summary>
                              <p className="mt-2 pl-4 border-l-2 border-border">
                                {round.next_question_rationale}
                              </p>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold">访谈总结</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-accent/30 p-4">
                          <h4 className="text-sm font-semibold mb-3 text-primary">
                            关键 Job Stories
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {(currentTranscript.summary?.key_job_stories || []).map((story, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{story}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>

                        <Card className="bg-accent/30 p-4">
                          <h4 className="text-sm font-semibold mb-3 text-primary">
                            痛点识别
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {(currentTranscript.summary?.pain_points || []).map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>

                        <Card className="bg-accent/30 p-4">
                          <h4 className="text-sm font-semibold mb-3 text-primary">
                            情感触发点
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {(currentTranscript.summary?.emotional_triggers || []).map((trigger, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{trigger}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>

                        <Card className="bg-accent/30 p-4">
                          <h4 className="text-sm font-semibold mb-3 text-primary">
                            决策因素
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {(currentTranscript.summary?.decision_factors || []).map((factor, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {!isRunning && completedPersonas.length > 0 && !currentTranscript && (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">所有访谈已完成</h3>
                    <p className="text-muted-foreground mb-6">
                      共完成 {completedPersonas.length} 位受访者的深度访谈
                    </p>
                    <Button onClick={() => setLocation(`/studies/${studyId}`)} className="btn-neon">
                      查看调研详情
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
