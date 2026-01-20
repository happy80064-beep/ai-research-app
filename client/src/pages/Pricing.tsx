import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const plans = [
  {
    name: "Free",
    description: "Perfect for first-time users",
    price: "$0",
    period: "",
    tokens: "1M free tokens",
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
      "Cannot purchase additional tokens",
      "Single Social Platform Data Access",
      "Generate up to 10 AI Personas for market research",
      "Standard analysis model",
      "Import interview transcripts to build private Human AI Personas (limited features)",
      "Conduct professional interviews with real people and AI Personas (limited features)",
    ],
  },
  {
    name: "Pro",
    description: "For regular in-depth business analysis",
    price: "$20",
    period: "/month",
    tokens: "2M tokens (30-day validity)",
    bonus: "+1M bonus tokens per month",
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
    popular: true,
    features: [
      "Purchase additional tokens anytime ($16 per 1M + 1M bonus)",
      "Multi-modal input analysis and insights (text, images, etc.)",
      "Multi-Platform Social Intelligence (Instagram, X, TikTok, RedNote, Douyin, etc.)",
      "Unlimited advanced custom AI Personas for highly targeted research",
      "Enhanced report reasoning model",
      "Import interview transcripts to build private Human AI Personas (limited features)",
      "Conduct professional interviews with real people and AI Personas (limited features)",
      "Early Access: Generate podcasts from studies",
    ],
  },
  {
    name: "Max",
    description: "For advanced business analysis",
    price: "$50",
    period: "/month",
    tokens: "5M tokens (30-day validity)",
    bonus: "+3M bonus tokens per month",
    cta: "Upgrade to Max",
    ctaVariant: "default" as const,
    popular: false,
    features: [
      "Purchase additional tokens anytime ($16 per 1M + 1M bonus)",
      "Multi-modal input analysis and insights (text, images, etc.)",
      "Multi-Platform Social Intelligence (Instagram, X, TikTok, RedNote, Douyin, etc.)",
      "Curated AI Personas with authentic behavioral patterns and realistic traits",
      "Superior report reasoning model",
      "Follow-up queries on generated reports",
      "Import interview transcripts to build private Human AI Personas (full features)",
      "Conduct professional interviews with real people and AI Personas (full features)",
      "Early Access: Generate podcasts from studies",
      "Early Access: Product R&D research workflow for innovation and ideation",
    ],
  },
];

export default function Pricing() {
  const [billingType, setBillingType] = useState<"individual" | "team">("individual");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing</h1>
            <p className="text-muted-foreground text-lg">
              Choose the plan that works best for you
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs
              value={billingType}
              onValueChange={(v) => setBillingType(v as "individual" | "team")}
            >
              <TabsList className="bg-card">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="team">Team & Enterprise</TabsTrigger>
                <TabsTrigger value="unlimited">Unlimited</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`glass-card p-8 relative ${
                  plan.popular ? "border-primary ring-1 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{plan.tokens}</span>
                  </div>
                  {plan.bonus && (
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">Limited Offer: {plan.bonus}</span>
                    </div>
                  )}
                </div>

                <Link href={plan.name === "Free" ? "/studies/new" : "/dashboard"}>
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full mb-6 ${plan.popular ? "btn-neon" : ""}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground mt-12">
            A typical research study uses approximately 400K tokens. Complex analyses may require
            additional tokens.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
