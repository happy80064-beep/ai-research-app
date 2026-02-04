# 中国国内访问优化指南

## 架构优势说明

你的应用部署在美国 Zeabur 服务器，这对中国用户来说实际上是**优势**：

```
┌─────────────────────────────────────────────────────────────────┐
│                         中国用户                                  │
│  ┌──────────────┐                                               │
│  │   浏览器      │                                               │
│  └──────┬───────┘                                               │
│         │ 1. 访问网站                                             │
│         │    (Zeabur 域名国内可访问)                               │
│         ▼                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │      Zeabur 美国服务器                 │                      │
│  │  ┌──────────────┐  ┌──────────────┐  │                      │
│  │  │   前端应用    │  │   后端 API    │  │                      │
│  │  └──────────────┘  └──────┬───────┘  │                      │
│  │                          │ 2. 调用 AI │                      │
│  │                          ▼           │                      │
│  │  ┌──────────────────────────────────┐│                      │
│  │  │  Gemini/Kimi/Qwen/Deepseek API   ││                      │
│  │  │  (美国服务器自由访问)              ││                      │
│  │  └──────────────────────────────────┘│                      │
│  └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## 为什么这个架构对中国用户友好

### 1. 用户只需访问 Zeabur
- Zeabur 域名 (`*.zeabur.app`) **国内可以直接访问**
- 无需 VPN 即可打开应用
- 如果你的应用使用自定义域名，确保域名已备案或选择国内可访问的域名

### 2. AI 调用由服务端完成
- 用户浏览器 **不需要** 直接访问 Gemini API
- AI 模型调用由部署在美国的后端完成
- 美国服务器可以**自由访问** Gemini、OpenAI 等 API

### 3. 自动故障转移
- 当 Gemini 不可用时，自动切换到 Kimi、Qwen 等国内友好的模型
- 确保服务稳定性

## 部署配置建议

### 1. 域名配置

#### 方案 A：使用 Zeabur 默认域名（推荐）
```
你的应用地址: https://ai-research-app.zeabur.app
```
- 优点：自动 SSL，国内访问稳定
- 缺点：域名较长

#### 方案 B：使用自定义域名
```
你的应用地址: https://ai-research.yourdomain.com
```
- 需要配置 DNS 解析到 Zeabur
- 建议开启 Cloudflare CDN（国内访问更快）

### 2. 模型配置策略

在 `.env` 中配置多模型，确保国内可用：

```bash
# ============================================
# 首选模型：Gemini 2.5+
# ============================================
DEFAULT_MODEL=gemini-2.5-pro

# Gemini 配置（通过 Forge 代理）
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# 备用模型配置（国内用户友好）
KIMI_API_KEY=your_kimi_api_key
QWEN_API_KEY=your_qwen_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 3. 网络优化配置

#### 开启自动故障转移
```bash
ENABLE_AUTO_FAILOVER=true
```

#### 配置备用模型优先级
系统会自动按以下顺序尝试：
1. `gemini-2.5-pro` (首选)
2. `gemini-3.0-pro`
3. `kimi-2.5` (国内访问快)
4. `moonshot-v1-32k`
5. `qwen-max` (阿里云，国内稳定)
6. `qwen-turbo`
7. `deepseek-reasoner`
8. `deepseek-chat`

## 用户访问流程

### 首次访问
1. 用户在国内浏览器输入网址
2. DNS 解析到 Zeabur 美国服务器
3. 加载前端应用（静态资源）
4. 前端调用后端 API

### AI 功能使用
1. 用户填写调研需求
2. 前端发送请求到后端
3. 后端调用 Gemini API（美国服务器无阻碍）
4. 返回结果给前端

### 故障转移场景
- 如果 Gemini API 超时或失败
- 自动切换到 Kimi 或 Qwen
- 用户无感知，体验流畅

## 监控和调试

### 1. 查看模型状态
访问以下接口查看模型健康状态：
```
GET /api/trpc/system.modelStatus
```

返回示例：
```json
{
  "defaultModel": "gemini-2.5-pro",
  "autoFailoverEnabled": true,
  "totalModels": 8,
  "enabledModels": 5,
  "healthyModels": 4,
  "models": [
    {
      "name": "gemini-2.5-pro",
      "provider": "gemini",
      "enabled": true,
      "healthy": true,
      "inCooldown": false,
      "priority": 1
    },
    {
      "name": "kimi-2.5",
      "provider": "kimi",
      "enabled": true,
      "healthy": true,
      "inCooldown": false,
      "priority": 3
    }
  ]
}
```

### 2. 重置模型状态
如果某个模型被标记为不健康，管理员可以重置：
```
POST /api/trpc/system.resetModelHealth
```

## 常见问题

### Q: 国内用户访问 Zeabur 会不会很慢？
**A**: Zeabur 使用 Cloudflare CDN，国内访问速度可接受。如果对速度要求高，可以考虑：
- 开启 Cloudflare 中国网络（需要企业版）
- 使用自定义域名 + 国内 CDN

### Q: 用户需要配置 VPN 吗？
**A**: **不需要**。用户直接访问你的应用域名即可，AI 调用由服务端完成。

### Q: 如何确保服务稳定性？
**A**:
1. 配置多个模型 API Key
2. 开启 `ENABLE_AUTO_FAILOVER=true`
3. 定期查看模型状态接口
4. 配置监控告警

### Q: 某个模型 API 被封锁怎么办？
**A**: 系统会自动切换到其他可用模型。建议同时配置：
- Gemini（通过 Forge 代理）
- Kimi（Moonshot，国内）
- Qwen（阿里云，国内）
- Deepseek（国内）

## 最佳实践

### 1. 模型配置优先级
```bash
# 首选 Gemini（能力最强）
DEFAULT_MODEL=gemini-2.5-pro

# 备用模型（国内友好）
KIMI_API_KEY=sk-xxx       # Kimi 中文能力强
QWEN_API_KEY=sk-xxx       # 阿里云稳定
DEEPSEEK_API_KEY=sk-xxx   # 推理能力强
```

### 2. 监控建议
- 定期检查 `/api/trpc/system.modelStatus`
- 关注模型健康状态
- 设置告警：当可用模型少于 2 个时通知

### 3. 用户体验优化
- 在 UI 上显示当前使用的模型
- 当使用备用模型时给出提示
- 提供模型切换选项（可选）

## 总结

你的架构（美国 Zeabur + 多模型自动切换）对中国用户非常友好：

✅ **用户无需 VPN** 即可访问应用
✅ **AI 调用在服务端完成**，不受国内网络限制
✅ **自动故障转移** 确保服务稳定
✅ **多模型支持** 提供最佳体验

只需按照本指南配置，你的应用就可以在国内稳定运行！
