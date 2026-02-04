// ============================================
// 模型配置类型定义
// ============================================
export type ModelProvider = "openai" | "gemini" | "kimi" | "qwen" | "deepseek";

export interface ModelConfig {
  name: string;
  provider: ModelProvider;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  timeout: number;
  maxRetries: number;
}

// ============================================
// 基础环境变量
// ============================================
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000/api/oauth"),
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // OpenAI API (最稳定的首选)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "https://api.openai.com/v1",

  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiApiUrl: process.env.GEMINI_API_URL ?? "https://generativelanguage.googleapis.com/v1beta",

  // Kimi API
  kimiApiKey: process.env.KIMI_API_KEY ?? "",
  kimiApiUrl: process.env.KIMI_API_URL ?? "https://api.moonshot.cn/v1",

  // Qwen API
  qwenApiKey: process.env.QWEN_API_KEY ?? "",
  qwenApiUrl: process.env.QWEN_API_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",

  // Deepseek API
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekApiUrl: process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1",

  // 默认模型
  defaultModel: process.env.DEFAULT_MODEL ?? "gpt-4o-mini",

  // 是否启用自动故障转移
  enableAutoFailover: process.env.ENABLE_AUTO_FAILOVER !== "false",

  // 日志级别
  logLevel: process.env.LOG_LEVEL ?? "info",
};

// ============================================
// 多模型配置 - 只启用用户配置了 API Key 的模型
// ============================================
export const MODEL_CONFIGS: ModelConfig[] = [
  // OpenAI (最稳定，首选)
  ...(ENV.openaiApiKey ? [
    {
      name: "gpt-4o-mini",
      provider: "openai" as const,
      apiKey: ENV.openaiApiKey,
      baseUrl: ENV.openaiApiUrl,
      enabled: true,
      priority: 1,
      timeout: 60000,
      maxRetries: 2,
    },
    {
      name: "gpt-4o",
      provider: "openai" as const,
      apiKey: ENV.openaiApiKey,
      baseUrl: ENV.openaiApiUrl,
      enabled: true,
      priority: 2,
      timeout: 60000,
      maxRetries: 2,
    },
  ] : []),

  // Gemini
  ...(ENV.geminiApiKey ? [
    {
      name: "gemini-1.5-pro",
      provider: "gemini" as const,
      apiKey: ENV.geminiApiKey,
      baseUrl: ENV.geminiApiUrl,
      enabled: true,
      priority: 3,
      timeout: 60000,
      maxRetries: 2,
    },
    {
      name: "gemini-1.5-flash",
      provider: "gemini" as const,
      apiKey: ENV.geminiApiKey,
      baseUrl: ENV.geminiApiUrl,
      enabled: true,
      priority: 4,
      timeout: 60000,
      maxRetries: 2,
    },
  ] : []),

  // Kimi
  ...(ENV.kimiApiKey ? [
    {
      name: "moonshot-v1-8k",
      provider: "kimi" as const,
      apiKey: ENV.kimiApiKey,
      baseUrl: ENV.kimiApiUrl,
      enabled: true,
      priority: 5,
      timeout: 60000,
      maxRetries: 2,
    },
  ] : []),

  // Qwen
  ...(ENV.qwenApiKey ? [
    {
      name: "qwen-turbo",
      provider: "qwen" as const,
      apiKey: ENV.qwenApiKey,
      baseUrl: ENV.qwenApiUrl,
      enabled: true,
      priority: 6,
      timeout: 60000,
      maxRetries: 2,
    },
  ] : []),

  // Deepseek
  ...(ENV.deepseekApiKey ? [
    {
      name: "deepseek-chat",
      provider: "deepseek" as const,
      apiKey: ENV.deepseekApiKey,
      baseUrl: ENV.deepseekApiUrl,
      enabled: true,
      priority: 7,
      timeout: 60000,
      maxRetries: 2,
    },
  ] : []),
];

// ============================================
// 获取启用的模型配置（按优先级排序）
// ============================================
export function getEnabledModelConfigs(): ModelConfig[] {
  return MODEL_CONFIGS
    .filter(config => config.enabled)
    .sort((a, b) => a.priority - b.priority);
}

// ============================================
// 获取指定模型配置
// ============================================
export function getModelConfig(modelName: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(config => config.name === modelName);
}

// ============================================
// 获取默认模型配置
// ============================================
export function getDefaultModelConfig(): ModelConfig | undefined {
  // 首先尝试使用用户配置的默认模型
  const userDefault = getModelConfig(ENV.defaultModel);
  if (userDefault?.enabled) {
    return userDefault;
  }
  // 否则使用第一个启用的模型
  return getEnabledModelConfigs()[0];
}

// ============================================
// 检查是否有任何模型可用
// ============================================
export function hasAnyEnabledModel(): boolean {
  return MODEL_CONFIGS.some(config => config.enabled);
}

// ============================================
// 启动时打印模型配置状态（调试用）
// ============================================
export function logModelConfigStatus(): void {
  console.log("\n========== Model Configuration Status ==========");
  console.log(`OpenAI API Key: ${ENV.openaiApiKey ? "✓ Loaded (" + ENV.openaiApiKey.substring(0, 10) + "...)" : "✗ Not set"}`);
  console.log(`OpenAI API URL: ${ENV.openaiApiUrl}`);
  console.log(`Gemini API Key: ${ENV.geminiApiKey ? "✓ Loaded (" + ENV.geminiApiKey.substring(0, 10) + "...)" : "✗ Not set"}`);
  console.log(`Gemini API URL: ${ENV.geminiApiUrl}`);
  console.log(`Kimi API Key: ${ENV.kimiApiKey ? "✓ Loaded (" + ENV.kimiApiKey.substring(0, 10) + "...)" : "✗ Not set"}`);
  console.log(`Kimi API URL: ${ENV.kimiApiUrl}`);
  console.log(`Qwen API Key: ${ENV.qwenApiKey ? "✓ Loaded (" + ENV.qwenApiKey.substring(0, 10) + "...)" : "✗ Not set"}`);
  console.log(`Qwen API URL: ${ENV.qwenApiUrl}`);
  console.log(`Deepseek API Key: ${ENV.deepseekApiKey ? "✓ Loaded (" + ENV.deepseekApiKey.substring(0, 10) + "...)" : "✗ Not set"}`);
  console.log(`Deepseek API URL: ${ENV.deepseekApiUrl}`);
  console.log(`\nEnabled Models: ${MODEL_CONFIGS.filter(c => c.enabled).map(c => c.name).join(", ") || "NONE"}`);
  console.log(`Default Model: ${ENV.defaultModel}`);
  console.log("================================================\n");
}

// 立即执行日志打印
logModelConfigStatus();
