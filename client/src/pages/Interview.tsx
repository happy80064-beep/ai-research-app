import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, ArrowLeft } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  id: number;
  role: "interviewer" | "persona";
  content: string;
}

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const studyId = parseInt(id || "0");
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: study } = trpc.study.getById.useQuery(
    { id: studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const { data: personas } = trpc.persona.listByStudy.useQuery(
    { studyId },
    { enabled: isAuthenticated && studyId > 0 }
  );

  const chatMutation = trpc.interview.chat.useMutation({
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "persona", content: data.response },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selectedPersonaId || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "interviewer", content: userMessage },
    ]);
    setInput("");
    setIsLoading(true);

    chatMutation.mutate({
      studyId,
      personaId: selectedPersonaId,
      message: userMessage,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const selectedPersona = personas?.find((p: any) => p.id === selectedPersonaId);

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 pt-20">
        <div className="h-full flex">
          {/* Sidebar - Persona Selection */}
          <div className="w-80 border-r border-border bg-card/50 p-4 overflow-y-auto">
            <Link href={`/studies/${studyId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Study
            </Link>

            <h2 className="font-semibold mb-4">Select Persona</h2>

            {personas && personas.length > 0 ? (
              <div className="space-y-2">
                {personas.map((persona: any) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setMessages([]);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedPersonaId === persona.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {persona.name?.charAt(0) || "P"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {persona.age} · {persona.occupation}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No personas available. Generate personas first.
              </p>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedPersona ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {selectedPersona.name?.charAt(0) || "P"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedPersona.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedPersona.age} · {selectedPersona.occupation} · {selectedPersona.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start the interview by asking a question</p>
                      <p className="text-sm mt-2">
                        Try asking about their preferences, motivations, or decision-making process
                      </p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "interviewer" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "persona" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl ${
                          message.role === "interviewer"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                      {message.role === "interviewer" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted p-4 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border bg-card/50">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question..."
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="btn-neon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a persona to start</p>
                  <p className="text-sm">Choose an AI persona from the sidebar to begin the interview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
