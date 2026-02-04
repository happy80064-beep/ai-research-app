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

1.  注册并登录 [Zeabur Dashboard](https://zeabur.com)。
2.  创建一个新项目 (Project)。
3.  点击 "Deploy New Service" -> "Git"，选择你的 GitHub 仓库。
4.  Zeabur 会自动检测到这是一个 Node.js 项目。
5.  **设置持久化存储 (Volume)**：
    *   在服务的 "Settings" -> "Volume" 中，挂载一个路径。
    *   建议挂载路径为 `/app/data`。
    *   这样你的 `sqlite.db` 就不会在每次重新部署时丢失。
6.  **设置环境变量**：
    *   进入 "Variables" 标签页。
    *   添加 `DATABASE_URL`，值为 `file:/app/data/sqlite.db` (确保路径与挂载点一致)。
    *   添加 `JWT_SECRET`，值为随机生成的长字符串。
    *   添加 `DEFAULT_MODEL`，推荐值 `gemini-2.5-pro`。
    *   添加 `BUILT_IN_FORGE_API_KEY`，你的 AI API Key。
    *   **推荐**：添加备用模型 API Key 以提高稳定性：
        *   `KIMI_API_KEY`: Kimi API Key（国内访问快）
        *   `QWEN_API_KEY`: Qwen API Key（阿里云，稳定）
        *   `DEEPSEEK_API_KEY`: Deepseek API Key（推理能力强）
    *   添加 `ENABLE_AUTO_FAILOVER`，设置为 `true`。
7.  Zeabur 会自动运行 `npm install` 和 `npm run build`，然后启动服务。

### 中国用户访问说明

部署在美国 Zeabur 的应用，**中国用户无需 VPN 即可访问**：
- Zeabur 域名在国内可直接访问
- AI 模型调用由服务端完成，用户不直接访问 Gemini
- 建议配置 Kimi/Qwen 作为备用模型

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
