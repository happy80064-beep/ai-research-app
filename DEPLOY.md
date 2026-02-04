# 部署指南 (Deployment Guide)

本应用是一个全栈应用（React 前端 + Node.js 后端），并使用 SQLite 作为数据库。为了让其他人可以体验试用，推荐将其部署到支持持久化存储和 Node.js 环境的云平台。

推荐使用 **Zeabur** 或 **Railway**，因为它们部署简单且支持 SQLite 数据库文件的持久化。

## 部署准备

1.  **代码仓库**：确保你的代码已经推送到 GitHub 或 GitLab。
2.  **环境变量**：你需要准备好以下环境变量（参考 `.env.example` 文件）：

### 必需配置
    *   `JWT_SECRET`: 一个随机的长字符串（用于加密）。
    *   `BUILT_IN_FORGE_API_KEY`: 你的 AI API Key（支持 Gemini、Kimi、Qwen、Deepseek）。
    *   `DATABASE_URL`: 设置为 `file:/app/data/sqlite.db` (Zeabur) 或 `file:/railway/volume/sqlite.db` (Railway)，具体取决于平台的文件挂载路径。
    *   `DEFAULT_MODEL`: 默认使用的模型，推荐 `gemini-2.5-pro`。

### 多模型配置（推荐）
为了获得最佳稳定性，建议配置多个模型 API Key，系统会自动故障转移：
    *   `KIMI_API_KEY`: Kimi (Moonshot) API Key
    *   `QWEN_API_KEY`: 阿里云 Qwen API Key
    *   `DEEPSEEK_API_KEY`: Deepseek API Key

### 其他配置
    *   `NODE_ENV`: 设置为 `production`。
    *   `HTTPS_PROXY`: **注意**：如果部署到海外服务器（如 Zeabur 美国节点），通常**不需要**设置此项，请留空。
    *   `ENABLE_AUTO_FAILOVER`: 设置为 `true` 启用自动故障转移。

## 方案一：部署到 Zeabur (推荐)

Zeabur 对中文开发者友好，且自动识别构建命令。

### 快速部署步骤

1.  注册并登录 [Zeabur Dashboard](https://dash.zeabur.com)。
2.  创建新项目，选择 **United States** 区域。
3.  点击 "Deploy New Service" -> "Git"，选择你的 GitHub 仓库 `happy80064-beep/ai-research-app`。
4.  等待自动构建（约 2-3 分钟）。
5.  **配置 Volume**（必需）：
    *   进入服务 "Settings" -> "Volume"
    *   添加 Volume，挂载路径 `/app/data`
6.  **配置环境变量**（必需）：
    *   进入 "Variables" 标签
    *   添加 `DATABASE_URL` = `file:/app/data/sqlite.db`
    *   添加 `JWT_SECRET` = 随机长字符串（`openssl rand -base64 32`）
    *   添加 `DEFAULT_MODEL` = `gemini-2.5-pro`
    *   添加 `BUILT_IN_FORGE_API_KEY` = 你的 API Key
    *   **推荐**：添加 `KIMI_API_KEY`、`QWEN_API_KEY`、`DEEPSEEK_API_KEY`
    *   添加 `ENABLE_AUTO_FAILOVER` = `true`
7.  生成域名：进入 "Networking" -> "Generate Domain"
8.  访问域名验证部署

### 📖 详细部署指南

👉 查看完整的 **[ZEABUR_DEPLOY_GUIDE.md](./ZEABUR_DEPLOY_GUIDE.md)** 获取：
- 详细的图文步骤
- 环境变量完整说明
- 常见问题排查
- 部署后验证清单
- 安全建议

### 中国用户访问说明

部署在美国 Zeabur 的应用，**中国用户无需 VPN 即可访问**：
- Zeabur 域名在国内可直接访问
- AI 模型调用由服务端完成，用户不直接访问 Gemini
- 建议配置 Kimi/Qwen 作为备用模型

### 一键验证部署

```bash
# 查看模型状态
curl https://your-app.zeabur.app/api/trpc/system.modelStatus

# 应该返回包含 enabledModels 和 healthyModels 的 JSON
```

## 方案二：部署到 Railway

1.  注册并登录 [Railway](https://railway.app)。
2.  点击 "New Project" -> "Deploy from GitHub repo"。
3.  选择你的仓库。
4.  **设置挂载卷 (Volume)**：
    *   在服务设置中，添加一个 Volume。
    *   挂载路径设为 `/app/data` (或者你喜欢的路径)。
5.  **环境变量**：
    *   设置 `DATABASE_URL` 为 `file:/app/data/sqlite.db`。
    *   设置其他环境变量。
6.  Railway 也会自动识别并构建。

## 方案三：使用 Docker (通用)

如果你有自己的服务器，可以使用 Docker 部署。

1.  构建镜像：
    ```bash
    docker build -t research-app .
    ```
2.  运行容器（记得挂载数据卷）：
    ```bash
    docker run -d -p 3000:3000 \
      -v $(pwd)/data:/app/data \
      -e DATABASE_URL="file:/app/data/sqlite.db" \
      -e JWT_SECRET="your_secret" \
      -e BUILT_IN_FORGE_API_KEY="your_key" \
      research-app
    ```

---

## 注意事项

*   **数据库文件**：由于项目使用 SQLite，请务必配置**持久化存储 (Volume)**，否则每次重新部署数据都会丢失。
*   **网络问题**：如果服务器在海外，请移除 `HTTPS_PROXY` 环境变量，以免连接失败。
