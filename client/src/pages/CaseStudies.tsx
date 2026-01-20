import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Eye, Users, MessageSquare, Clock, ArrowRight } from "lucide-react";

export default function CaseStudies() {
  const { data: studies, isLoading } = trpc.study.listPublic.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore real-world examples of AI-powered consumer research and discover the insights
              that drive business decisions.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : studies && studies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studies.map((study: any) => (
                <div key={study.id} className="glass-card p-6 card-hover group">
                  {study.isFeatured && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                      Featured
                    </span>
                  )}

                  <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {study.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {study.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{study.personaCount || 0} personas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{study.interviewCount || 0} interviews</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(study.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/studies/${study.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-primary">
                        View Study
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No case studies yet</h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for inspiring examples of AI-powered research.
              </p>
              <Link href="/studies/new">
                <Button className="btn-neon">Create Your Own Study</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
