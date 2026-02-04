import { ENV } from "./env";
import { invokeLLMWithFailover } from "./modelRouter";

/**
 * LLM 调用模块
 * 支持多模型自动故障转移
 * 向后兼容原有 API
 */

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  model?: string;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

/**
 * 调用 LLM - 支持多模型自动故障转移
 *
 * 优先使用指定的模型，如果失败则自动切换到备用模型
 * 支持的模型: gemini-2.5+, kimi-2.5, qwen, deepseek-reasoner
 *
 * @param params - 调用参数
 * @returns LLM 响应结果
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // 检查是否启用自动故障转移
  if (!ENV.enableAutoFailover) {
    console.log("[LLM] Auto failover is disabled, using single model");
  }

  try {
    const result = await invokeLLMWithFailover(params);
    return result;
  } catch (error) {
    // 增强错误信息
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[LLM] All model invocations failed: ${errorMessage}`);

    // 如果错误信息已经包含 [ModelRouter]，直接抛出
    if (errorMessage.includes("[ModelRouter]")) {
      throw error;
    }

    // 否则包装错误
    throw new Error(`LLM invoke failed: ${errorMessage}`);
  }
}

/**
 * 获取当前模型状态（用于健康检查）
 */
export { getModelStatus, resetModelHealth } from "./modelRouter";
