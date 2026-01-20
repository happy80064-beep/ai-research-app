import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, Brain } from "lucide-react";
import { Streamdown } from "streamdown";

interface ThinkingProcessProps {
  title: string;
  status: "thinking" | "completed" | "error";
  content?: string;
  searchResults?: {
    query: string;
    summary: string;
    sources: { title: string; url: string }[];
  };
  defaultExpanded?: boolean;
}

export function ThinkingProcess({
  title,
  status,
  content,
  searchResults,
  defaultExpanded = false,
}: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="glass-card border-l-4 border-l-primary">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {status === "thinking" && (
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            )}
            {status === "completed" && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
            {status === "error" && (
              <Brain className="w-5 h-5 text-destructive flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{title}</h4>
              {status === "thinking" && (
                <p className="text-xs text-muted-foreground mt-1">AI 正在思考...</p>
              )}
            </div>
          </div>

          {(content || searchResults) && status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <>
                  <span className="text-xs mr-1">收起</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="text-xs mr-1">查看过程</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        {isExpanded && status === "completed" && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            {searchResults && (
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground mb-2">搜索查询</h5>
                  <div className="bg-accent/30 rounded-lg p-3">
                    <code className="text-sm">{searchResults.query}</code>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground mb-2">搜索摘要</h5>
                  <div className="text-sm text-muted-foreground">
                    <Streamdown>{searchResults.summary}</Streamdown>
                  </div>
                </div>

                {searchResults.sources.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                      参考来源
                    </h5>
                    <div className="space-y-2">
                      {searchResults.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-primary hover:underline"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {content && !searchResults && (
              <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                <Streamdown>{content}</Streamdown>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ThinkingStepProps {
  title: string;
  description?: string;
  status: "pending" | "thinking" | "completed" | "error";
  content?: string;
  searchResults?: {
    query: string;
    summary: string;
    sources: { title: string; url: string }[];
  };
}

export function ThinkingStep({
  title,
  description,
  status,
  content,
  searchResults,
}: ThinkingStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border last:hidden" />

      {/* Status indicator */}
      <div className="absolute left-0 top-1">
        {status === "pending" && (
          <div className="w-4 h-4 rounded-full border-2 border-muted bg-background" />
        )}
        {status === "thinking" && (
          <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20 animate-pulse" />
        )}
        {status === "completed" && (
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        {status === "error" && (
          <div className="w-4 h-4 rounded-full bg-destructive" />
        )}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {(content || searchResults) && status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 -mt-1"
            >
              <span className="text-xs mr-1">{isExpanded ? "收起" : "查看"}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>

        {isExpanded && status === "completed" && (
          <div className="mt-3 space-y-3">
            {searchResults && (
              <>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">搜索查询</p>
                  <code className="text-xs">{searchResults.query}</code>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">搜索摘要</p>
                  <div className="text-xs text-muted-foreground">
                    <Streamdown>{searchResults.summary}</Streamdown>
                  </div>
                </div>

                {searchResults.sources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">参考来源</p>
                    <div className="space-y-1">
                      {searchResults.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-primary hover:underline truncate"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {content && !searchResults && (
              <div className="text-xs text-muted-foreground prose prose-sm max-w-none">
                <Streamdown>{content}</Streamdown>
              </div>
            )}
          </div>
        )}

        {status === "thinking" && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>处理中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
