import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Loader2, Search, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "intro" | "background" | "scenario" | "dimensions" | "confirm" | "creating";

interface ResearchPlan {
  targetAudience: string;
  researchGoal: string;
  scenario: "work" | "personal" | "both";
  dimensions: string[];
  personaCount: number;
  qualityLevel: "standard" | "premium";
}

export default function NewStudyInteractive() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("intro");
  const [plan, setPlan] = useState<ResearchPlan>({
    targetAudience: "",
    researchGoal: "",
    scenario: "both",
    dimensions: [],
    personaCount: 5,
    qualityLevel: "premium",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    findings: Array<{ text: string; source: string; year: string }>;
  } | null>(null);
  const [scenarioDescriptions, setScenarioDescriptions] = useState<{
    work: string;
    personal: string;
    both: string;
  } | null>(null);
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false);
  const [recommendedDimensions, setRecommendedDimensions] = useState<
    Array<{ name: string; description: string }>
  >([]);
  const [isRecommendingDimensions, setIsRecommendingDimensions] = useState(false);
  const [researchPlan, setResearchPlan] = useState<{
    interviewCount: { min: number; max: number };
    duration: number;
    questionType: string;
    rationale: string;
  } | null>(null);
  const [isRecommendingPlan, setIsRecommendingPlan] = useState(false);

  const analyzeIndustryMutation = trpc.study.analyzeIndustry.useMutation({
    onSuccess: (data) => {
      setAnalysisResults(data);
      setIsSearching(false);
    },
    onError: (error) => {
      toast.error(`分析失败：${error.message}`);
      setIsSearching(false);
    },
  });

  const generateScenariosMutation = trpc.study.generateScenarioDescriptions.useMutation({
    onSuccess: (data) => {
      // 确保数据格式正确
      const safeData = {
        work: data?.work || "如会议、报告、决策支持等工作场景",
        personal: data?.personal || "如健康、家庭、休闲等个人生活场景",
        both: data?.both || "综合研究工作和个人场景下的决策逻辑",
      };
      setScenarioDescriptions(safeData);
      setIsGeneratingScenarios(false);
    },
    onError: (error) => {
      toast.error(`生成场景描述失败：${error.message}`);
      setIsGeneratingScenarios(false);
      // 失败后使用默认描述
      setScenarioDescriptions({
        work: "如会议、报告、决策支持等工作场景",
        personal: "如健康、家庭、休闲等个人生活场景",
        both: "综合研究工作和个人场景下的决策逻辑",
      });
    },
  });

  const recommendDimensionsMutation = trpc.study.recommendDimensions.useMutation({
    onSuccess: (data) => {
      setRecommendedDimensions(data);
      setIsRecommendingDimensions(false);
    },
    onError: (error) => {
      toast.error(`推荐维度失败：${error.message}`);
      setIsRecommendingDimensions(false);
      // 失败后使用默认维度
      setRecommendedDimensions([
        { name: "真实需求与痛点", description: "他们到底遇到什么问题，痛点强度如何" },
        { name: "决策逻辑与顾虑", description: "他们如何选择、担心什么、决策路径是什么" },
        { name: "消费意愿与价格敏感度", description: "愿意为什么付费、价格敏感区间、付费触发点" },
        { name: "隐私安全与信任门槛", description: "如何建立信任、隐私顾虑清单、缓解策略" },
      ]);
    },
  });

  const recommendPlanMutation = trpc.study.recommendResearchPlan.useMutation({
    onSuccess: (data) => {
      setResearchPlan(data);
      setIsRecommendingPlan(false);
    },
    onError: (error) => {
      toast.error(`推荐调研计划失败：${error.message}`);
      setIsRecommendingPlan(false);
      // 失败后使用默认计划
      setResearchPlan({
        interviewCount: { min: 8, max: 12 },
        duration: 45,
        questionType: "半结构化",
        rationale: "基于您的调研目标和维度，建议进行 8-12 次每次 45 分钟的半结构化访谈。",
      });
    },
  });

  const createStudy = trpc.study.create.useMutation({
    onSuccess: (data) => {
      toast.success("调研项目创建成功！");
      setLocation(`/studies/${data.id}`);
    },
    onError: (error) => {
      toast.error(`创建失败：${error.message}`);
      setStep("confirm");
    },
  });

  const handleNext = () => {
    const steps: Step[] = ["intro", "background", "scenario", "dimensions", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setStep(nextStep);
      
      // 当进入场景选择步骤时，自动生成场景描述
      if (nextStep === "scenario" && !scenarioDescriptions && plan.targetAudience && plan.researchGoal) {
        setIsGeneratingScenarios(true);
        generateScenariosMutation.mutate({
          targetAudience: plan.targetAudience,
          researchGoal: plan.researchGoal,
        });
      }
      
      // 当进入维度选择步骤时，自动推荐维度
      if (nextStep === "dimensions" && recommendedDimensions.length === 0 && plan.targetAudience && plan.researchGoal && plan.scenario) {
        setIsRecommendingDimensions(true);
        recommendDimensionsMutation.mutate({
          targetAudience: plan.targetAudience,
          researchGoal: plan.researchGoal,
          scenario: plan.scenario,
        });
      }
      
      // 当进入确认步骤时，自动推荐调研计划
      if (nextStep === "confirm" && !researchPlan && plan.targetAudience && plan.researchGoal && plan.scenario && plan.dimensions.length > 0) {
        setIsRecommendingPlan(true);
        recommendPlanMutation.mutate({
          targetAudience: plan.targetAudience,
          researchGoal: plan.researchGoal,
          scenario: plan.scenario,
          dimensions: plan.dimensions,
        });
      }
    }
  };

  const handleBack = () => {
    const steps: Step[] = ["intro", "background", "scenario", "dimensions", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleAnalyzeIndustry = () => {
    if (!plan.targetAudience || !plan.researchGoal) {
      toast.error("请先填写目标人群和调研目标");
      return;
    }
    setIsSearching(true);
    analyzeIndustryMutation.mutate({
      targetAudience: plan.targetAudience,
      researchGoal: plan.researchGoal,
    });
  };

  const handleCreateStudy = () => {
    setStep("creating");
    createStudy.mutate({
      title: `${plan.targetAudience.substring(0, 50)} - 商业调研`,
      description: `研究场景：${plan.scenario === "work" ? "工作场景" : plan.scenario === "personal" ? "个人/家庭场景" : "工作与个人场景"}\n关注维度：${plan.dimensions.join("、")}`,
      researchObjective: plan.researchGoal,
      targetAudience: plan.targetAudience,
      researchQuestions: plan.dimensions.length > 0 ? plan.dimensions : ["用户需求与痛点"],
      demographicCriteria: {},
      personaCount: plan.personaCount,
    });
  };

  const toggleDimension = (dimension: string) => {
    setPlan(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimension)
        ? prev.dimensions.filter(d => d !== dimension)
        : [...prev.dimensions, dimension],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Progress indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {["intro", "background", "scenario", "dimensions", "confirm"].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === s
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : ["intro", "background", "scenario", "dimensions", "confirm"].indexOf(step) > index
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all ${
                        ["intro", "background", "scenario", "dimensions", "confirm"].indexOf(step) > index
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <Card className="glass-card p-8">
            {step === "intro" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">{t('newStudyInteractive.welcome.title')}</h2>
                  <p className="text-muted-foreground text-lg">
                    {t('newStudyInteractive.welcome.subtitle')}
                  </p>
                </div>

                <div className="bg-accent/50 rounded-xl p-6 space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {t('newStudyInteractive.welcome.features.title')}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{t('newStudyInteractive.welcome.features.item1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{t('newStudyInteractive.welcome.features.item2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{t('newStudyInteractive.welcome.features.item3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{t('newStudyInteractive.welcome.features.item4')}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} className="btn-neon gap-2">
                    {t('newStudyInteractive.welcome.start')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "background" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('newStudyInteractive.background.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('newStudyInteractive.background.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetAudience" className="text-base font-semibold mb-2 block">
                      {t('newStudyInteractive.background.audienceLabel')}
                    </Label>
                    <Textarea
                      id="targetAudience"
                      placeholder={t('newStudyInteractive.background.audiencePlaceholder')}
                      value={plan.targetAudience}
                      onChange={(e) => setPlan({ ...plan, targetAudience: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="researchGoal" className="text-base font-semibold mb-2 block">
                      {t('newStudyInteractive.background.objectiveLabel')}
                    </Label>
                    <Textarea
                      id="researchGoal"
                      placeholder={t('newStudyInteractive.background.objectivePlaceholder')}
                      value={plan.researchGoal}
                      onChange={(e) => setPlan({ ...plan, researchGoal: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {plan.targetAudience && (
                    <div className="bg-accent/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">{t('newStudyInteractive.background.industryAnalysis')}</span>
                      </div>
                      {!analysisResults && !isSearching && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAnalyzeIndustry}
                          className="w-full"
                        >
                          {t('newStudyInteractive.background.quickAnalysis')}
                        </Button>
                      )}
                      {isSearching && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('newStudyInteractive.background.analyzing')}</span>
                        </div>
                      )}
                      {analysisResults && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-foreground">{t('newStudyInteractive.background.analysisResult')}</div>
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            {analysisResults.findings.map((finding, index) => (
                              <li key={index} className="flex flex-col gap-1">
                                <span>{index + 1}. {finding.text}</span>
                                <span className="text-xs text-muted-foreground/70 pl-4">
                                  —— {finding.source}，{finding.year}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.prev')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!plan.targetAudience || !plan.researchGoal}
                    className="btn-neon gap-2"
                  >
                    {t('common.next')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "scenario" && (
              <div className="space-y-6" key="scenario-step">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('newStudyInteractive.scenario.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('newStudyInteractive.scenario.subtitle')}
                  </p>
                </div>

                {isGeneratingScenarios ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-accent/30 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('newStudyInteractive.scenario.generating')}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Work Scenario */}
                    <div
                      key="work-scenario"
                      className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                        plan.scenario === 'work' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setPlan({ ...plan, scenario: 'work' })}
                    >
                      <div className="mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          plan.scenario === 'work' ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {plan.scenario === 'work' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{t('newStudyInteractive.scenario.work')}</div>
                        <div className="text-sm text-muted-foreground">
                          {scenarioDescriptions?.work || t('newStudyInteractive.scenario.workDefault')}
                        </div>
                      </div>
                    </div>

                    {/* Personal Scenario */}
                    <div
                      key="personal-scenario"
                      className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                        plan.scenario === 'personal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setPlan({ ...plan, scenario: 'personal' })}
                    >
                      <div className="mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          plan.scenario === 'personal' ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {plan.scenario === 'personal' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{t('newStudyInteractive.scenario.personal')}</div>
                        <div className="text-sm text-muted-foreground">
                          {scenarioDescriptions?.personal || t('newStudyInteractive.scenario.personalDefault')}
                        </div>
                      </div>
                    </div>

                    {/* Both Scenarios */}
                    <div
                      key="both-scenario"
                      className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                        plan.scenario === 'both' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setPlan({ ...plan, scenario: 'both' })}
                    >
                      <div className="mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          plan.scenario === 'both' ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {plan.scenario === 'both' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{t('newStudyInteractive.scenario.both')}</div>
                        <div className="text-sm text-muted-foreground">
                          {scenarioDescriptions?.both || t('newStudyInteractive.scenario.bothDefault')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.prev')}
                  </Button>
                  <Button onClick={handleNext} className="btn-neon gap-2">
                    {t('common.next')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "dimensions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('newStudyInteractive.dimensions.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('newStudyInteractive.dimensions.subtitle')}
                  </p>
                </div>

                {isRecommendingDimensions && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-accent/30 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('newStudyInteractive.dimensions.recommending')}</span>
                  </div>
                )}

                {!isRecommendingDimensions && (
                  <div className="space-y-3">
                    {recommendedDimensions.map((dimension, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => toggleDimension(dimension.name)}
                      >
                        <Checkbox
                          id={`dimension-${index}`}
                          checked={plan.dimensions.includes(dimension.name)}
                          onCheckedChange={() => toggleDimension(dimension.name)}
                          className="mt-1"
                        />
                        <Label htmlFor={`dimension-${index}`} className="cursor-pointer flex-1">
                          <div className="font-semibold mb-1">{dimension.name}</div>
                          <div className="text-sm text-muted-foreground">{dimension.description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.prev')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={plan.dimensions.length === 0}
                    className="btn-neon gap-2"
                  >
                    {t('common.next')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('newStudyInteractive.confirm.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('newStudyInteractive.confirm.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-accent/30 rounded-xl p-5">
                    <h3 className="font-semibold mb-3 text-primary">{t('newStudyInteractive.confirm.intent')}</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.targetAudience')}</span>
                        <p className="text-muted-foreground mt-1">{plan.targetAudience}</p>
                      </div>
                      <div>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.researchGoal')}</span>
                        <p className="text-muted-foreground mt-1">{plan.researchGoal}</p>
                      </div>
                      <div>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.scenario')}</span>
                        <p className="text-muted-foreground mt-1">
                          {plan.scenario === "work"
                            ? t('newStudyInteractive.scenario.workDefault')
                            : plan.scenario === "personal"
                            ? t('newStudyInteractive.scenario.personalDefault')
                            : t('newStudyInteractive.scenario.bothDefault')}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.dimensions')}</span>
                        <p className="text-muted-foreground mt-1">
                          {plan.dimensions
                            .map((d) => {
                              const labels: Record<string, string> = {
                                needs: t('newStudyInteractive.dimensions.needs'),
                                decision: t('newStudyInteractive.dimensions.decision'),
                                willingness: t('newStudyInteractive.dimensions.willingness'),
                                privacy: t('newStudyInteractive.dimensions.privacy'),
                              };
                              return labels[d] || d;
                            })
                            .join("、")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/30 rounded-xl p-5">
                    <h3 className="font-semibold mb-3 text-primary">{t('newStudyInteractive.confirm.method')}</h3>
                    
                    {isRecommendingPlan && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-background/50 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('newStudyInteractive.confirm.recommendingPlan')}</span>
                      </div>
                    )}
                    
                    {researchPlan && (
                      <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-primary font-semibold">{t('newStudyInteractive.confirm.aiPlan')}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-semibold">{t('newStudyInteractive.confirm.interviewCount')}</span>
                            <span className="text-muted-foreground ml-2">
                              {researchPlan.interviewCount.min}-{researchPlan.interviewCount.max} {t('common.times')}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">{t('newStudyInteractive.confirm.duration')}</span>
                            <span className="text-muted-foreground ml-2">
                              {researchPlan.duration} {t('common.minutes')}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">{t('newStudyInteractive.confirm.questionType')}</span>
                            <span className="text-muted-foreground ml-2">
                              {researchPlan.questionType}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">{t('newStudyInteractive.confirm.rationale')}</span>
                            <span className="text-muted-foreground ml-2">
                              {researchPlan.rationale}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.analysisFrame')}</span>
                        <span className="text-muted-foreground ml-2">
                          {t('newStudyInteractive.confirm.analysisFrameDesc')}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.researchMode')}</span>
                        <span className="text-muted-foreground ml-2">
                          {t('newStudyInteractive.confirm.researchModeDesc')}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">{t('newStudyInteractive.confirm.personaConfig')}</span>
                        <span className="text-muted-foreground ml-2">
                          {plan.personaCount} {t('newStudyInteractive.confirm.personaCount')}, {plan.qualityLevel === "premium" ? "Premium" : "Standard"} 
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent/30 rounded-xl p-5">
                    <h3 className="font-semibold mb-3 text-primary">{t('newStudyInteractive.confirm.output')}</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{t('newStudyInteractive.confirm.output1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{t('newStudyInteractive.confirm.output2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{t('newStudyInteractive.confirm.output3')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{t('newStudyInteractive.confirm.output4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">{t('newStudyInteractive.confirm.personaCount')}</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newValue = Math.max(3, plan.personaCount - 1);
                          setPlan({ ...plan, personaCount: newValue });
                        }}
                        disabled={plan.personaCount <= 3}
                        className="h-10 w-10 shrink-0"
                      >
                        <span className="text-lg">-</span>
                      </Button>
                      <div className="flex-1 text-center font-mono text-xl font-bold">
                        {plan.personaCount}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newValue = Math.min(10, plan.personaCount + 1);
                          setPlan({ ...plan, personaCount: newValue });
                        }}
                        disabled={plan.personaCount >= 10}
                        className="h-10 w-10 shrink-0"
                      >
                        <span className="text-lg">+</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('newStudyInteractive.confirm.personaCountRange')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.prev')}
                  </Button>
                  <Button onClick={handleCreateStudy} className="btn-neon gap-2">
                    {t('newStudyInteractive.confirm.start')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "creating" && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">{t('newStudyInteractive.creating.title')}</h3>
                <p className="text-muted-foreground">
                  {t('newStudyInteractive.creating.subtitle')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
