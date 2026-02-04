# Zeabur 完整部署指南

## 🎉 代码已推送

代码已成功推送到 GitHub：
```
https://github.com/happy80064-beep/ai-research-app
```

---

## 📋 部署前准备

### 1. 注册账号

1. 访问 [Zeabur 官网](https://zeabur.com)
2. 点击 "Sign Up" 注册账号（支持 GitHub 登录）

### 2. 准备 API Key

你需要准备以下 API Key（至少一个）：

| 平台 | 用途 | 获取地址 |
|:---|:---|:---|
| **Forge/Manus** | 主要 AI 调用 | https://forge.manus.im |
| **Kimi** (Moonshot) | 备用模型 | https://platform.moonshot.cn |
| **Qwen** (阿里云) | 备用模型 | https://dashscope.aliyun.com |
| **Deepseek** | 备用模型 | https://platform.deepseek.com |

**建议**：配置多个 API Key 以提高稳定性

---

## 🚀 Zeabur 部署步骤

### 步骤 1：创建项目

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com)
2. 点击 "Create Project"
3. 选择区域：推荐 **United States**（美国服务器访问 AI API 更稳定）

### 步骤 2：部署服务

1. 在项目页面点击 "Deploy New Service"
2. 选择 "Git"
3. 授权 GitHub 账号
4. 选择仓库：`happy80064-beep/ai-research-app`
5. 选择分支：`main`
6. 点击 "Deploy"

Zeabur 会自动检测这是 Node.js 项目并开始构建。

### 步骤 3：配置持久化存储（Volume）

SQLite 数据库需要持久化存储，否则每次部署数据会丢失。

1. 等待首次部署完成（会失败，因为没配置 Volume，这是正常的）
2. 点击服务名称进入详情页
3. 选择 "Settings" 标签
4. 找到 "Volume" 部分
5. 点击 "Add Volume"
6. 配置如下：
   - **Mount Path**: `/app/data`
   - **Size**: 1GB（免费额度）或更高

### 步骤 4：配置环境变量

1. 点击 "Variables" 标签
2. 逐个添加以下环境变量：

#### 必需变量

| 变量名 | 值 | 说明 |
|:---|:---|:---|
| `JWT_SECRET` | 随机字符串（32位以上） | 用于加密，可用命令生成：`openssl rand -base64 32` |
| `DATABASE_URL` | `file:/app/data/sqlite.db` | 数据库路径，必须与 Volume 挂载路径一致 |
| `DEFAULT_MODEL` | `gemini-2.5-pro` | 默认使用的 AI 模型 |
| `BUILT_IN_FORGE_API_KEY` | your_forge_api_key | 主要 AI API Key |
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.im` | Forge API 地址 |

#### 备用模型变量（强烈推荐配置）

| 变量名 | 值 | 说明 |
|:---|:---|:---|
| `KIMI_API_KEY` | your_kimi_key | Kimi API Key |
| `QWEN_API_KEY` | your_qwen_key | 阿里云 Qwen API Key |
| `DEEPSEEK_API_KEY` | your_deepseek_key | Deepseek API Key |

#### 其他配置

| 变量名 | 值 | 说明 |
|:---|:---|:---|
| `ENABLE_AUTO_FAILOVER` | `true` | 启用自动故障转移 |
| `VITE_APP_ID` | your_app_id | 应用 ID（可选） |
| `OWNER_OPEN_ID` | your_open_id | 管理员 OpenID（可选） |

### 步骤 5：重新部署

1. 添加完所有环境变量后，Zeabur 会自动重新部署
2. 等待部署完成（约 2-3 分钟）
3. 点击 "Logs" 查看部署日志，确认无错误

### 步骤 6：生成域名

1. 部署成功后，点击 "Networking" 标签
2. 在 "Public Access" 部分
3. 点击 "Generate Domain"
4. 记录生成的域名，例如：`ai-research-app-xxxx.zeabur.app`

### 步骤 7：验证部署

1. 访问生成的域名
2. 确认首页正常加载
3. 测试功能：
   - 访问 `/api/trpc/system.modelStatus` 查看模型状态
   - 创建测试调研项目
   - 测试 AI 生成功能

---

## 🔍 验证清单

### 部署后检查

- [ ] 应用首页可以正常访问
- [ ] 访问 `/api/trpc/system.modelStatus` 返回正常 JSON
- [ ] 可以创建新的调研项目
- [ ] AI 可以正常生成人物画像
- [ ] 数据库数据在重新部署后仍然保留

### 检查命令

```bash
# 查看模型状态
curl https://your-app.zeabur.app/api/trpc/system.modelStatus

# 应该返回类似：
{
  "defaultModel": "gemini-2.5-pro",
  "autoFailoverEnabled": true,
  "totalModels": 5,
  "enabledModels": 3,
  "healthyModels": 3,
  "models": [...]
}
```

---

## 🔧 常见问题

### 问题 1：部署失败，日志显示数据库错误

**原因**：没有配置 Volume 或 DATABASE_URL 路径错误

**解决**：
1. 确认已添加 Volume，挂载路径为 `/app/data`
2. 确认 DATABASE_URL 为 `file:/app/data/sqlite.db`
3. 重新部署

### 问题 2：AI 调用失败

**原因**：API Key 配置错误或模型不可用

**解决**：
1. 检查环境变量中的 API Key 是否正确
2. 访问 `/api/trpc/system.modelStatus` 查看模型状态
3. 如果主模型失败，检查备用模型是否配置

### 问题 3：重新部署后数据丢失

**原因**：没有正确配置 Volume

**解决**：
1. 检查 Volume 是否正确挂载到 `/app/data`
2. 检查 DATABASE_URL 是否指向 `/app/data/sqlite.db`
3. 注意：首次配置 Volume 前的数据无法恢复

### 问题 4：国内访问慢

**原因**：网络延迟

**解决**：
- Zeabur 默认使用 Cloudflare CDN，国内访问通常可接受
- 如需更快，可配置自定义域名 + 国内 CDN

### 问题 5：如何查看日志

1. 在 Zeabur Dashboard 点击你的服务
2. 点击 "Logs" 标签
3. 查看实时日志和错误信息

---

## 📊 资源使用

### 免费额度

Zeabur 免费版提供：
- 1GB 存储（Volume）
- 每月一定额度的计算资源
- 免费子域名

### 升级建议

如果应用流量增加：
1. 考虑升级到 Hobby 计划
2. 增加 Volume 容量
3. 配置自定义域名

---

## 🔐 安全建议

### 部署后必做

1. **更换 JWT_SECRET**
   ```bash
   # 生成新的密钥
   openssl rand -base64 32
   ```
   更新到 Zeabur 环境变量

2. **检查 API Key 安全**
   ```bash
   # 运行安全检查
   pnpm run security:check
   ```

3. **监控 API 使用**
   - 定期查看 AI 平台的使用记录
   - 设置用量告警

---

## 📝 更新应用

当代码更新后：

1. 推送代码到 GitHub
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. Zeabur 会自动检测并重新部署

3. 等待部署完成（约 1-2 分钟）

4. 验证更新

---

## 🎯 下一步

部署完成后，你可以：

1. **配置自定义域名**
   - 在 "Networking" 中添加自定义域名
   - 配置 DNS 解析

2. **启用监控**
   - 查看 Zeabur 内置监控
   - 配置外部监控（如 UptimeRobot）

3. **优化性能**
   - 配置 CDN
   - 启用缓存

4. **扩展功能**
   - 配置 Stripe 支付
   - 添加更多 AI 模型

---

## 📞 获取帮助

如果遇到问题：

1. 查看 Zeabur 文档：https://docs.zeabur.com
2. 查看应用日志排查错误
3. 检查模型状态接口确认配置
4. 在 GitHub 提交 Issue

---

**部署成功后，你的应用将具备：**
- ✅ 多模型自动故障转移
- ✅ 中国用户无需 VPN 访问
- ✅ 数据持久化存储
- ✅ 完整的安全保护
- ✅ 自动 HTTPS

祝你部署顺利！🎉
