import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  FileText,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  MoreVertical,
  Trash2,
  Eye,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  generating_personas: "bg-yellow-500/20 text-yellow-400",
  interviewing: "bg-blue-500/20 text-blue-400",
  analyzing: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  generating_personas: "Generating Personas",
  interviewing: "Interviewing",
  analyzing: "Analyzing",
  completed: "Completed",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: studies, isLoading, refetch } = trpc.study.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const deleteMutation = trpc.study.delete.useMutation({
    onSuccess: () => {
      toast.success("Study deleted successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete study");
    },
  });

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
              <h1 className="text-3xl font-bold mb-4">Sign in to continue</h1>
              <p className="text-muted-foreground mb-8">
                Access your research dashboard and manage your AI studies.
              </p>
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
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">My Research Studies</h1>
              <p className="text-muted-foreground">
                Manage your AI-powered consumer research projects
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  <span className="font-semibold text-primary">
                    {((user as any)?.tokenBalance || 1000000).toLocaleString()}
                  </span>{" "}
                  tokens
                </span>
              </div>
              <Link href="/studies/new">
                <Button className="btn-neon gap-2">
                  <Plus className="w-4 h-4" />
                  New Study
                </Button>
              </Link>
            </div>
          </div>

          {/* Studies Grid */}
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
              {studies.map((study) => (
                <div key={study.id} className="glass-card p-6 card-hover group">
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[study.status]
                      }`}
                    >
                      {statusLabels[study.status]}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/studies/${study.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate({ id: study.id })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Link href={`/studies/${study.id}`}>
                    <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">
                      {study.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {study.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{(study as any).personaCount || 0} personas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{(study as any).interviewCount || 0} interviews</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(study.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{study.tokensUsed.toLocaleString()} tokens</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No studies yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-powered research study to get started.
              </p>
              <Link href="/studies/new">
                <Button className="btn-neon gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Study
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
