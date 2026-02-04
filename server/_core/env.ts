// ============================================
// 模型配置类型定义
// ============================================
export type ModelProvider = "gemini" | "kimi" | "qwen" | "deepseek" | "forge";

export interface ModelConfig {
  name: string;
  provider: ModelProvider;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  priority: number; // 优先级，数字越小越优先
  timeout: number; // 超时时间（毫秒）
  maxRetries: number; // 最大重试次数
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

  // 主要 API 配置 (向后兼容)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  defaultModel: process.env.DEFAULT_MODEL ?? "gemini-2.5-pro",

  // 是否启用自动故障转移
  enableAutoFailover: process.env.ENABLE_AUTO_FAILOVER !== "false",

  // 日志级别
  logLevel: process.env.LOG_LEVEL ?? "info",
};

// ============================================
// 多模型配置
// ============================================
export const MODEL_CONFIGS: ModelConfig[] = [
  // Gemini 2.5+ 系列 (首选)
  {
    name: "gemini-2.5-pro",
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY ?? ENV.forgeApiKey ?? "",
    baseUrl: process.env.GEMINI_API_URL ?? "https://generativelanguage.googleapis.com/v1beta",
    enabled: !!(process.env.GEMINI_API_KEY ?? ENV.forgeApiKey),
    priority: 1,
    timeout: 60000,
    maxRetries: 2,
  },
  {
    name: "gemini-3.0-pro",
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY ?? ENV.forgeApiKey ?? "",
    baseUrl: process.env.GEMINI_API_URL ?? "https://generativelanguage.googleapis.com/v1beta",
    enabled: !!(process.env.GEMINI_API_KEY ?? ENV.forgeApiKey),
    priority: 2,
    timeout: 60000,
    maxRetries: 2,
  },
  // Kimi 2.5 系列
  {
    name: "kimi-2.5",
    provider: "kimi",
    apiKey: process.env.KIMI_API_KEY ?? "",
    baseUrl: process.env.KIMI_API_URL ?? "https://api.moonshot.cn/v1",
    enabled: !!process.env.KIMI_API_KEY,
    priority: 3,
    timeout: 60000,
    maxRetries: 2,
  },
  {
    name: "moonshot-v1-32k",
    provider: "kimi",
    apiKey: process.env.KIMI_API_KEY ?? "",
    baseUrl: process.env.KIMI_API_URL ?? "https://api.moonshot.cn/v1",
    enabled: !!process.env.KIMI_API_KEY,
    priority: 4,
    timeout: 60000,
    maxRetries: 2,
  },
  // Qwen 系列
  {
    name: "qwen-max",
    provider: "qwen",
    apiKey: process.env.QWEN_API_KEY ?? "",
    baseUrl: process.env.QWEN_API_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
    enabled: !!process.env.QWEN_API_KEY,
    priority: 5,
    timeout: 60000,
    maxRetries: 2,
  },
  {
    name: "qwen-turbo",
    provider: "qwen",
    apiKey: process.env.QWEN_API_KEY ?? "",
    baseUrl: process.env.QWEN_API_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
    enabled: !!process.env.QWEN_API_KEY,
    priority: 6,
    timeout: 60000,
    maxRetries: 2,
  },
  // Deepseek 系列
  {
    name: "deepseek-reasoner",
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseUrl: process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1",
    enabled: !!process.env.DEEPSEEK_API_KEY,
    priority: 7,
    timeout: 120000, // Deepseek thinking 需要更长时间
    maxRetries: 2,
  },
  {
    name: "deepseek-chat",
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseUrl: process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1",
    enabled: !!process.env.DEEPSEEK_API_KEY,
    priority: 8,
    timeout: 60000,
    maxRetries: 2,
  },
  // Forge 通用配置 (向后兼容)
  {
    name: "forge-default",
    provider: "forge",
    apiKey: ENV.forgeApiKey ?? "",
    baseUrl: ENV.forgeApiUrl ?? "https://forge.manus.im",
    enabled: !!ENV.forgeApiKey,
    priority: 9,
    timeout: 60000,
    maxRetries: 2,
  },
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
