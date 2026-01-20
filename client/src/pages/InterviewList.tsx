import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  MessageSquare,
  User,
  Briefcase,
  MapPin,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function InterviewList() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  const { data: study } = trpc.study.getById.useQuery(
    { id: studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: interviews, isLoading } = trpc.interview.getByStudyId.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

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
              <h1 className="text-3xl font-bold mb-4">登录查看访谈记录</h1>
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/studies/${studyId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              返回调研详情
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">访谈记录</h1>
              <p className="text-muted-foreground">{study?.title}</p>
            </div>
          </div>

          {interviews && interviews.length > 0 ? (
            <div className="grid gap-4">
              {interviews.map((interview: any) => {
                const persona = interview.persona;
                const conversationData = typeof interview.conversationData === 'string' 
                  ? JSON.parse(interview.conversationData) 
                  : interview.conversationData;
                
                return (
                  <div
                    key={interview.id}
                    className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedInterview(interview)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{persona.name}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {persona.age}岁
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                {persona.occupation}
                              </span>
                              {persona.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {persona.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(interview.createdAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          <span>{conversationData?.messages?.length || 0} 条对话</span>
                          <span className="ml-2">点击查看完整访谈记录</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">暂无访谈记录</h3>
              <p className="text-muted-foreground mb-6">
                开始与 AI 人物画像进行访谈后，访谈记录将显示在这里。
              </p>
              <Link href={`/studies/${studyId}`}>
                <Button className="btn-neon">返回调研详情</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Interview Detail Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedInterview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedInterview.persona.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {selectedInterview.persona.age}岁 · {selectedInterview.persona.occupation}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {(() => {
                  const conversationData = typeof selectedInterview.conversationData === 'string'
                    ? JSON.parse(selectedInterview.conversationData)
                    : selectedInterview.conversationData;
                  
                  return conversationData?.messages?.map((msg: any, index: number) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'assistant' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div className={`flex-1 rounded-lg p-4 ${
                        msg.role === 'assistant'
                          ? 'bg-muted/50'
                          : 'bg-primary/10'
                      }`}>
                        <div className="text-sm font-medium mb-1">
                          {msg.role === 'assistant' ? selectedInterview.persona.name : '研究员'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
