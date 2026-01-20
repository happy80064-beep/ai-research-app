import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Target,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Research Topic", icon: Target },
  { id: 2, title: "Target Audience", icon: Users },
  { id: 3, title: "Research Questions", icon: HelpCircle },
  { id: 4, title: "Generate Personas", icon: Sparkles },
];

interface FormData {
  title: string;
  description: string;
  researchObjective: string;
  targetAudience: string;
  ageRange: string;
  gender: string;
  location: string;
  income: string;
  occupation: string;
  interests: string;
  researchQuestions: string[];
  personaCount: number;
}

export default function NewStudy() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    researchObjective: "",
    targetAudience: "",
    ageRange: "25-45",
    gender: "All",
    location: "",
    income: "",
    occupation: "",
    interests: "",
    researchQuestions: ["", "", ""],
    personaCount: 5,
  });

  const createStudyMutation = trpc.study.create.useMutation({
    onSuccess: (data) => {
      toast.success("Study created! Generating personas...");
      navigate(`/studies/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create study");
      setIsGenerating(false);
    },
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.researchQuestions];
    newQuestions[index] = value;
    setFormData((prev) => ({ ...prev, researchQuestions: newQuestions }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      researchQuestions: [...prev.researchQuestions, ""],
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.researchQuestions.length > 1) {
      const newQuestions = formData.researchQuestions.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, researchQuestions: newQuestions }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.researchObjective.trim();
      case 2:
        return formData.targetAudience.trim();
      case 3:
        return formData.researchQuestions.some((q) => q.trim());
      case 4:
        return formData.personaCount >= 1 && formData.personaCount <= 20;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    createStudyMutation.mutate({
      title: formData.title,
      description: formData.description,
      researchObjective: formData.researchObjective,
      targetAudience: formData.targetAudience,
      researchQuestions: formData.researchQuestions.filter((q) => q.trim()),
      demographicCriteria: {
        ageRange: formData.ageRange,
        gender: formData.gender,
        location: formData.location,
        income: formData.income,
        occupation: formData.occupation,
        interests: formData.interests.split(",").map((i) => i.trim()).filter(Boolean),
      },
      personaCount: formData.personaCount,
    });
  };

  if (authLoading) {
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
              <h1 className="text-3xl font-bold mb-4">Sign in to create a study</h1>
              <p className="text-muted-foreground mb-8">
                Create AI-powered research studies to understand your target audience.
              </p>
              <a href={getLoginUrl()}>
                <Button className="btn-neon">Sign In to Continue</Button>
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
        <div className="container max-w-3xl">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-full h-0.5 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ width: "80px" }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={`text-xs ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="glass-card p-8">
            {/* Step 1: Research Topic */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Define Your Research Topic</h2>
                  <p className="text-muted-foreground">
                    What do you want to learn about your target audience?
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Study Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Consumer Preferences for Sustainable Fashion"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your research study..."
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objective">Research Objective *</Label>
                    <Textarea
                      id="objective"
                      placeholder="What specific insights are you trying to uncover? What decisions will this research inform?"
                      value={formData.researchObjective}
                      onChange={(e) => updateField("researchObjective", e.target.value)}
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Target Audience */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Define Your Target Audience</h2>
                  <p className="text-muted-foreground">
                    Describe the demographic and psychographic characteristics of your ideal respondents.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetAudience">Target Audience Description *</Label>
                    <Textarea
                      id="targetAudience"
                      placeholder="e.g., Young professionals aged 25-35 who are interested in sustainable living and make conscious purchasing decisions..."
                      value={formData.targetAudience}
                      onChange={(e) => updateField("targetAudience", e.target.value)}
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ageRange">Age Range</Label>
                      <Input
                        id="ageRange"
                        placeholder="e.g., 25-45"
                        value={formData.ageRange}
                        onChange={(e) => updateField("ageRange", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Input
                        id="gender"
                        placeholder="e.g., All, Female, Male"
                        value={formData.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., United States, Urban areas"
                        value={formData.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="income">Income Level</Label>
                      <Input
                        id="income"
                        placeholder="e.g., $50K-$100K"
                        value={formData.income}
                        onChange={(e) => updateField("income", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      placeholder="e.g., Marketing professionals, Tech workers"
                      value={formData.occupation}
                      onChange={(e) => updateField("occupation", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interests">Interests (comma-separated)</Label>
                    <Input
                      id="interests"
                      placeholder="e.g., Technology, Sustainability, Health & Wellness"
                      value={formData.interests}
                      onChange={(e) => updateField("interests", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Research Questions */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Research Questions</h2>
                  <p className="text-muted-foreground">
                    What specific questions do you want to explore with your AI personas?
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.researchQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                        <Textarea
                          id={`question-${index}`}
                          placeholder="e.g., What factors influence your decision to purchase sustainable products?"
                          value={question}
                          onChange={(e) => updateQuestion(index, e.target.value)}
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>
                      {formData.researchQuestions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeQuestion(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button variant="outline" onClick={addQuestion} className="w-full">
                    + Add Another Question
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Generate Personas */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Generate AI Personas</h2>
                  <p className="text-muted-foreground">
                    How many AI personas would you like to generate for this study?
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="personaCount">Number of Personas</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Input
                        id="personaCount"
                        type="number"
                        min={1}
                        max={20}
                        value={formData.personaCount}
                        onChange={(e) => updateField("personaCount", parseInt(e.target.value) || 1)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        (1-20 personas recommended)
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold">Study Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{formData.title || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Audience:</span>
                        <span className="font-medium truncate max-w-xs">
                          {formData.targetAudience || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Research Questions:</span>
                        <span className="font-medium">
                          {formData.researchQuestions.filter((q) => q.trim()).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Personas to Generate:</span>
                        <span className="font-medium">{formData.personaCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm">
                      Estimated token usage: ~{(formData.personaCount * 50000).toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canProceed()}
                  className="btn-neon gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isGenerating}
                  className="btn-neon gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
