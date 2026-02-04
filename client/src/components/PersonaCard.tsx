import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, User, Briefcase, MapPin, DollarSign, Heart, TrendingUp, Star } from "lucide-react";
import { useState } from "react";

interface PersonaCardProps {
  persona: {
    id: number;
    name: string;
    age: number;
    gender: string;
    location: string;
    occupation: string;
    income: string;
    personality: {
      traits: string[];
      values: string[];
      motivations: string[];
      painPoints: string[];
    };
    behaviorPatterns: {
      shoppingHabits: string[];
      mediaConsumption: string[];
      decisionFactors: string[];
    };
    backstory: string;
    interviewCompleted: boolean;
    qualityScore?: number;
  };
  onStartInterview?: () => void;
}

export function PersonaCard({ persona, onStartInterview }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(false);

  // 安全地解析 JSON 数据，防止格式错误导致崩溃
  const parseJSONSafely = (data: any, defaultValue: any = {}) => {
    if (typeof data === 'object' && data !== null) return data;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('Failed to parse JSON:', data);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const personality = parseJSONSafely(persona.personality, {
    traits: [],
    values: [],
    motivations: [],
    painPoints: []
  });

  const behaviorPatterns = parseJSONSafely(persona.behaviorPatterns, {
    shoppingHabits: [],
    mediaConsumption: [],
    decisionFactors: []
  });

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-2 border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{persona.name}</h3>
            <p className="text-sm text-muted-foreground">
              {persona.age}岁 · {persona.gender}
            </p>
          </div>
        </div>
        {persona.interviewCompleted && persona.qualityScore && (
          <div className="flex items-center gap-1 bg-accent/30 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold">{persona.qualityScore.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <span>{persona.occupation}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{persona.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span>{persona.income}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">{persona.backstory}</p>
      </div>

      {expanded && (
        <div className="space-y-4 mb-4 animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">性格特征</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {personality?.traits?.map((trait: string, idx: number) => (
                <Badge key={idx} variant="secondary">{trait}</Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">核心价值观</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {personality?.values?.map((value: string, idx: number) => (
                <Badge key={idx} variant="outline">{value}</Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">动机驱动</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {personality?.motivations?.map((motivation: string, idx: number) => (
                <li key={idx}>• {motivation}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">痛点</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {personality?.painPoints?.map((painPoint: string, idx: number) => (
                <li key={idx}>• {painPoint}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">行为模式</div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">购物习惯：</span>
                <p className="text-sm">{behaviorPatterns?.shoppingHabits?.join("、")}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">媒体消费：</span>
                <p className="text-sm">{behaviorPatterns?.mediaConsumption?.join("、")}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">决策因素：</span>
                <p className="text-sm">{behaviorPatterns?.decisionFactors?.join("、")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="flex-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              收起详情
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              查看详情
            </>
          )}
        </Button>
        {onStartInterview && !persona.interviewCompleted && (
          <Button size="sm" onClick={onStartInterview} className="flex-1">
            开始访谈
          </Button>
        )}
      </div>
    </Card>
  );
}
