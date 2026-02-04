/**
 * 多模型路由管理器
 * 实现自动故障转移和智能模型选择
 */

import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import {
  ENV,
  getEnabledModelConfigs,
  getModelConfig,
  getDefaultModelConfig,
  type ModelConfig,
  type ModelProvider,
} from "./env";
import type {
  InvokeParams,
  InvokeResult,
  Message,
  Tool,
  ToolChoice,
  ResponseFormat,
  OutputSchema,
  JsonSchema,
} from "./llm";

// ============================================
// 模型健康状态追踪
// ============================================
interface ModelHealth {
  config: ModelConfig;
  lastUsed: number;
  failureCount: number;
  lastFailureTime: number | null;
  consecutiveFailures: number;
  isHealthy: boolean;
}

// 健康状态缓存
const modelHealthCache = new Map<string, ModelHealth>();

// 冷却时间（毫秒）- 失败后多久可以重试
const COOLDOWN_MS = 30000;

// 最大连续失败次数
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * 初始化模型健康状态
 */
function initModelHealth(): void {
  const configs = getEnabledModelConfigs();
  for (const config of configs) {
    if (!modelHealthCache.has(config.name)) {
      modelHealthCache.set(config.name, {
        config,
        lastUsed: 0,
        failureCount: 0,
        lastFailureTime: null,
        consecutiveFailures: 0,
        isHealthy: true,
      });
    }
  }
}

/**
 * 获取模型健康状态
 */
function getModelHealth(modelName: string): ModelHealth | undefined {
  return modelHealthCache.get(modelName);
}

/**
 * 更新模型成功状态
 */
function markModelSuccess(modelName: string): void {
  const health = modelHealthCache.get(modelName);
  if (health) {
    health.lastUsed = Date.now();
    health.consecutiveFailures = 0;
    health.isHealthy = true;
  }
}

/**
 * 更新模型失败状态
 */
function markModelFailure(modelName: string, error: Error): void {
  const health = modelHealthCache.get(modelName);
  if (health) {
    health.lastFailureTime = Date.now();
    health.failureCount++;
    health.consecutiveFailures++;

    // 如果连续失败超过阈值，标记为不健康
    if (health.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      health.isHealthy = false;
      console.warn(`[ModelRouter] Model ${modelName} marked as unhealthy after ${health.consecutiveFailures} consecutive failures`);
    }
  }
}

/**
 * 检查模型是否在冷却期
 */
function isInCooldown(modelName: string): boolean {
  const health = modelHealthCache.get(modelName);
  if (!health || !health.lastFailureTime) return false;

  const timeSinceFailure = Date.now() - health.lastFailureTime;
  return timeSinceFailure < COOLDOWN_MS;
}

/**
 * 获取可用的模型列表（按优先级排序，排除冷却期和不健康的）
 */
function getAvailableModels(preferredModel?: string): ModelConfig[] {
  initModelHealth();

  const allModels = getEnabledModelConfigs();

  // 首先检查指定的首选模型
  if (preferredModel) {
    const preferred = getModelConfig(preferredModel);
    if (preferred?.enabled && !isInCooldown(preferred.name)) {
      const health = getModelHealth(preferred.name);
      if (health?.isHealthy !== false) {
        // 将首选模型放在第一位
        return [preferred, ...allModels.filter(m => m.name !== preferred.name)];
      }
    }
  }

  // 过滤掉不健康或在冷却期的模型
  return allModels.filter(model => {
    const health = getModelHealth(model.name);
    if (!health) return true;
    if (!health.isHealthy) return false;
    if (isInCooldown(model.name)) return false;
    return true;
  });
}

// ============================================
// 消息格式转换
// ============================================
type Role = "system" | "user" | "assistant" | "tool" | "function";

interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

interface FileContent {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
}

type MessageContent = string | TextContent | ImageContent | FileContent;

function normalizeContentPart(part: MessageContent): TextContent | ImageContent | FileContent {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  return part;
}

function normalizeMessage(message: Message) {
  const { role, name, tool_call_id } = message;

  // 处理工具调用消息
  if (role === "tool" || role === "function") {
    const content = Array.isArray(message.content)
      ? message.content.map(part => typeof part === "string" ? part : JSON.stringify(part)).join("\n")
      : message.content;

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  // 确保内容是数组
  const contentParts = Array.isArray(message.content)
    ? message.content.map(normalizeContentPart)
    : [normalizeContentPart(message.content)];

  // 如果只有一条文本内容，简化为字符串
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
}

function normalizeToolChoice(
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | { type: "function"; function: { name: string } } | undefined {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }
    if (tools.length > 1) {
      throw new Error("tool_choice 'required' needs a single tool or specify the tool name explicitly");
    }
    return {
      type: "function" as const,
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function" as const,
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
}

function normalizeResponseFormat({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): { type: "json_schema"; json_schema: JsonSchema } | { type: "text" } | { type: "json_object" } | undefined {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
}

// ============================================
// 构建请求 URL
// ============================================
function buildApiUrl(config: ModelConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  // 不同 provider 的 API 路径不同
  switch (config.provider) {
    case "gemini":
      // Gemini 原生 API 端点（非 OpenAI 兼容）
      if (baseUrl.includes("generativelanguage.googleapis.com")) {
        // Gemini 使用模型特定的端点，需要在请求体中处理
        return `${baseUrl}/models`;
      }
      // 如果通过代理或兼容层，使用标准路径
      return `${baseUrl}/v1/chat/completions`;

    case "kimi":
    case "qwen":
    case "deepseek":
      return `${baseUrl}/chat/completions`;

    case "forge":
    default:
      return `${baseUrl}/v1/chat/completions`;
  }
}

// ============================================
// 模型名称映射表 - 如果模型名称需要转换
// ============================================
const MODEL_NAME_MAPPING: Record<string, Record<string, string>> = {
  // 目前所有模型名称都直接使用，不需要转换
  // 如果需要别名映射，可以在这里添加
};

// ============================================
// 获取实际模型名称
// ============================================
function getActualModelName(provider: string, modelName: string): string {
  const mapping = MODEL_NAME_MAPPING[provider];
  if (mapping && mapping[modelName]) {
    return mapping[modelName];
  }
  return modelName;
}

// ============================================
// 构建请求体
// ============================================
function buildRequestBody(
  config: ModelConfig,
  params: InvokeParams
): Record<string, unknown> {
  const { messages, model, tools, toolChoice, tool_choice, outputSchema, output_schema, responseFormat, response_format } = params;

  // 根据 provider 调整模型名称
  const actualModel = getActualModelName(config.provider, model || config.name);

  const payload: Record<string, unknown> = {
    model: actualModel,
    messages: messages.map(normalizeMessage),
  };

  // 工具调用
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // 最大 token 数
  payload.max_tokens = 8192;

  // 响应格式
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  return payload;
}

// ============================================
// 构建 Gemini 专用请求
// ============================================
function buildGeminiRequestBody(params: InvokeParams): Record<string, unknown> {
  const { messages, outputSchema, output_schema, responseFormat, response_format } = params;

  // 转换消息格式为 Gemini 格式
  const contents = messages.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }],
  }));

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  // 如果有 schema，添加到请求中
  const schema = outputSchema || output_schema;
  if (schema?.schema) {
    requestBody.generationConfig = {
      ...requestBody.generationConfig,
      responseSchema: schema.schema,
    };
  }

  return requestBody;
}

// ============================================
// 转换 Gemini 响应为 OpenAI 格式
// ============================================
function convertGeminiResponse(data: any, modelName: string): InvokeResult {
  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || "";

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: modelName,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || "stop",
      },
    ],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

// ============================================
// 调试日志函数
// ============================================
function logRequest(provider: string, url: string, headers: Record<string, string>, payload: any) {
  console.log(`\n========== ${provider} REQUEST ==========`);
  console.log(`URL: ${url}`);
  console.log(`Headers: ${JSON.stringify({ ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined })}`);
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
  console.log(`====================================\n`);
}

function logResponse(provider: string, status: number, data: any) {
  console.log(`\n========== ${provider} RESPONSE ==========`);
  console.log(`Status: ${status}`);
  console.log(`Data: ${JSON.stringify(data, null, 2).substring(0, 2000)}`);
  console.log(`=====================================\n`);
}

function logError(provider: string, error: any) {
  console.log(`\n========== ${provider} ERROR ==========`);
  if (error.response) {
    console.log(`Status: ${error.response.status}`);
    console.log(`StatusText: ${error.response.statusText}`);
    console.log(`Headers: ${JSON.stringify(error.response.headers)}`);
    console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
  } else {
    console.log(`Message: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
  console.log(`===================================\n`);
}

// ============================================
// 执行单个模型调用
// ============================================
async function invokeSingleModel(
  config: ModelConfig,
  params: InvokeParams
): Promise<InvokeResult> {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  // OpenAI 标准 API
  if (config.provider === "openai") {
    const url = `${config.baseUrl}/chat/completions`;
    const payload = buildRequestBody(config, params);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    const axiosConfig: Record<string, unknown> = {
      timeout: config.timeout,
      headers,
    };

    if (proxyUrl) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
      axiosConfig.proxy = false;
    }

    logRequest("OpenAI", url, headers, payload);

    try {
      const response = await axios.post(url, payload, axiosConfig);
      logResponse("OpenAI", response.status, response.data);
      markModelSuccess(config.name);
      return response.data as InvokeResult;
    } catch (error: any) {
      logError("OpenAI", error);
      throw error;
    }
  }

  // Gemini API
  if (config.provider === "gemini") {
    const modelName = config.name;
    const url = `${config.baseUrl}/models/${modelName}:generateContent?key=${config.apiKey}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const axiosConfig: Record<string, unknown> = {
      timeout: config.timeout,
      headers,
    };

    if (proxyUrl) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
      axiosConfig.proxy = false;
    }

    const payload = buildGeminiRequestBody(params);
    logRequest("Gemini", url.replace(config.apiKey, "***"), headers, payload);

    try {
      const response = await axios.post(url, payload, axiosConfig);
      logResponse("Gemini", response.status, response.data);
      markModelSuccess(config.name);
      return convertGeminiResponse(response.data, config.name);
    } catch (error: any) {
      logError("Gemini", error);
      throw error;
    }
  }

  // Kimi / Qwen / Deepseek (OpenAI 兼容)
  const url = `${config.baseUrl}/chat/completions`;
  const payload = buildRequestBody(config, params);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  const axiosConfig: Record<string, unknown> = {
    timeout: config.timeout,
    headers,
  };

  if (proxyUrl) {
    axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.proxy = false;
  }

  logRequest(config.provider, url, headers, payload);

  try {
    const response = await axios.post(url, payload, axiosConfig);
    logResponse(config.provider, response.status, response.data);
    markModelSuccess(config.name);
    return response.data as InvokeResult;
  } catch (error: any) {
    logError(config.provider, error);
    throw error;
  }
}

// ============================================
// 主调用函数 - 带自动故障转移
// ============================================
export async function invokeLLMWithFailover(params: InvokeParams): Promise<InvokeResult> {
  const availableModels = getAvailableModels(params.model);

  if (availableModels.length === 0) {
    // 如果没有可用模型，尝试使用所有启用的模型（包括冷却期的）
    const allEnabled = getEnabledModelConfigs();
    if (allEnabled.length === 0) {
      throw new Error("[ModelRouter] No models are enabled. Please configure at least one API key.");
    }

    console.warn("[ModelRouter] All models are in cooldown or unhealthy, trying all enabled models");
    availableModels.push(...allEnabled);
  }

  const errors: { model: string; error: Error }[] = [];

  for (const config of availableModels) {
    try {
      const result = await invokeSingleModel(config, params);

      // 如果使用了备用模型，记录日志
      if (params.model && config.name !== params.model) {
        console.log(`[ModelRouter] Successfully used fallback model: ${config.name}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ModelRouter] Model ${config.name} failed: ${errorMessage}`);

      markModelFailure(config.name, error instanceof Error ? error : new Error(errorMessage));
      errors.push({ model: config.name, error: error instanceof Error ? error : new Error(errorMessage) });

      // 继续尝试下一个模型
      continue;
    }
  }

  // 所有模型都失败了
  const errorSummary = errors.map(e => `${e.model}: ${e.error.message}`).join("; ");
  console.error(`[ModelRouter] All ${errors.length} models failed. Details:`);
  errors.forEach(e => {
    console.error(`  - ${e.model}: ${e.error.message}`);
    if (e.error.stack) {
      console.error(`    Stack: ${e.error.stack.split('\n')[0]}`);
    }
  });
  throw new Error(`[ModelRouter] All models failed. Errors: ${errorSummary}`);
}

// ============================================
// 获取当前模型状态
// ============================================
export function getModelStatus(): Array<{
  name: string;
  provider: ModelProvider;
  enabled: boolean;
  healthy: boolean;
  inCooldown: boolean;
  priority: number;
}> {
  initModelHealth();
  const allConfigs = getEnabledModelConfigs();

  return allConfigs.map(config => {
    const health = getModelHealth(config.name);
    return {
      name: config.name,
      provider: config.provider,
      enabled: config.enabled,
      healthy: health?.isHealthy ?? true,
      inCooldown: isInCooldown(config.name),
      priority: config.priority,
    };
  });
}

// ============================================
// 重置模型健康状态
// ============================================
export function resetModelHealth(): void {
  modelHealthCache.clear();
  initModelHealth();
  console.log("[ModelRouter] Model health status reset");
}

// 初始化
initModelHealth();
