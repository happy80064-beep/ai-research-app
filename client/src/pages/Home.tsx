import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Users,
  MessageSquare,
  BarChart3,
  FileText,
  Sparkles,
  Brain,
  Target,
  Zap,
  CheckCircle2,
  Star,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  const stats = [
    { value: "300K", label: t('home.stats.personas') },
    { value: "+1M", label: t('home.stats.interviews') },
    { value: "<30m", label: t('home.stats.minutes') },
  ];

  const features = [
    {
      icon: Users,
      title: t('home.features.testing.title'),
      description: t('home.features.testing.desc'),
    },
    {
      icon: Target,
      title: t('home.features.planning.title'),
      description: t('home.features.planning.desc'),
    },
    {
      icon: Brain,
      title: t('home.features.insights.title'),
      description: t('home.features.insights.desc'),
    },
    {
      icon: Sparkles,
      title: t('home.features.creation.title'),
      description: t('home.features.creation.desc'),
    },
  ];

  const workflow = [
    {
      step: "01",
      title: t('home.workflow.step1.title'),
      description: t('home.workflow.step1.desc'),
      icon: Sparkles,
      smallIcon: Sparkles,
      buttonText: t('home.workflow.step1.button'),
      color: "from-orange-100 to-orange-50",
      buttonColor: "bg-blue-400/30 text-white backdrop-blur-md border border-white/20",
      iconColor: "text-white",
      smallIconColor: "text-blue-400",
    },
    {
      step: "02",
      title: t('home.workflow.step2.title'),
      description: t('home.workflow.step2.desc'),
      icon: MessageSquare,
      smallIcon: MessageSquare,
      buttonText: t('home.workflow.step2.button'),
      color: "from-emerald-100 to-emerald-50",
      buttonColor: "bg-emerald-500/30 text-white backdrop-blur-md border border-white/20",
      iconColor: "text-white",
      smallIconColor: "text-emerald-500",
    },
    {
      step: "03",
      title: t('home.workflow.step3.title'),
      description: t('home.workflow.step3.desc'),
      icon: Brain,
      smallIcon: Brain,
      buttonText: t('home.workflow.step3.button'),
      color: "from-purple-100 to-purple-50",
      buttonColor: "bg-purple-500/30 text-white backdrop-blur-md border border-white/20",
      iconColor: "text-white",
      smallIconColor: "text-purple-500",
    },
    {
      step: "04",
      title: t('home.workflow.step4.title'),
      description: t('home.workflow.step4.desc'),
      icon: FileText,
      smallIcon: TrendingUp,
      buttonText: t('home.workflow.step4.button'),
      color: "from-amber-100 to-amber-50",
      buttonColor: "bg-orange-500/30 text-white backdrop-blur-md border border-white/20",
      iconColor: "text-white",
      smallIconColor: "text-orange-500",
    },
  ];

  const badges = [
    t('home.tech.badge1'),
    t('home.tech.badge2'),
    t('home.tech.badge3'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {t('home.hero.title')}{" "}
              <span className="italic gradient-text">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('home.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/studies/new">
                <Button className="btn-neon text-lg px-8 py-6 gap-2">
                  {t('home.hero.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                  <div className="flex -space-x-3 mr-2">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces" alt="Business woman" className="w-8 h-8 rounded-full border-2 border-background object-cover" />
                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces" alt="Business man" className="w-8 h-8 rounded-full border-2 border-background object-cover" />
                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces" alt="Business woman" className="w-8 h-8 rounded-full border-2 border-background object-cover" />
                    <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces" alt="Business man" className="w-8 h-8 rounded-full border-2 border-background object-cover" />
                  </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span>{t('hero.trusted')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.stats.title')}
            </h2>
            <h3 className="text-2xl md:text-3xl text-muted-foreground font-light mb-8">
              {t('home.stats.subtitle')}{" "}
              <span className="italic font-serif text-foreground">{t('home.stats.highlight')}</span>
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 rounded-full bg-purple-100 text-purple-700 flex items-center gap-2 font-medium">
                <span className="text-lg">🤖</span>
                {t('home.stats.tag1')}
              </div>
              <div className="px-6 py-3 rounded-full bg-blue-100 text-blue-700 flex items-center gap-2 font-medium">
                <span className="text-lg">💬</span>
                {t('home.stats.tag2')}
              </div>
              <div className="px-6 py-3 rounded-full bg-orange-100 text-orange-700 flex items-center gap-2 font-medium">
                <span className="text-lg">📊</span>
                {t('home.stats.tag3')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm text-primary font-medium mb-2">
              {t('home.workflow.sectionTitle')}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.workflow.mainTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((item, index) => (
              <div key={index} className="flex flex-col h-full bg-card rounded-3xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-300">
                {/* Top Half - Visual */}
                <div className={`h-40 bg-gradient-to-br ${item.color} flex items-center justify-center p-6 relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full blur-lg -ml-10 -mb-5" />
                  
                  <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 text-sm font-medium shadow-sm ${item.buttonColor}`}>
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    {item.buttonText}
                  </div>
                </div>
                
                {/* Bottom Half - Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-5xl font-bold text-muted-foreground/20 font-serif">
                      {item.step}
                    </div>
                    <item.smallIcon className={`w-5 h-5 ${item.smallIconColor} mt-2`} />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">{t('home.tech.sectionTitle')}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('home.tech.mainTitle')}
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t('home.tech.description')}
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{t('home.tech.point1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{t('home.tech.point2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{t('home.tech.point3')}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f1115] rounded-3xl p-8 text-white">
              <div className="mb-8">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('home.tech.ecosystemTitle')}</p>
                <h3 className="text-2xl font-bold">{t('home.tech.ecosystemMainTitle')}</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-[#1a2332] p-4 rounded-xl border border-blue-900/30">
                  <h4 className="text-blue-400 font-semibold mb-1">{t('home.tech.card1.title')}</h4>
                  <p className="text-gray-400 text-xs">{t('home.tech.card1.desc')}</p>
                </div>

                <div className="bg-[#152620] p-4 rounded-xl border border-green-900/30">
                  <h4 className="text-emerald-400 font-semibold mb-1">{t('home.tech.card2.title')}</h4>
                  <p className="text-gray-400 text-xs">{t('home.tech.card2.desc')}</p>
                </div>

                <div className="bg-[#2a1b35] p-4 rounded-xl border border-purple-900/30">
                  <h4 className="text-purple-400 font-semibold mb-1">{t('home.tech.card3.title')}</h4>
                  <p className="text-gray-400 text-xs">{t('home.tech.card3.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}


      <Footer />
    </div>
  );
}
