# AI Research App - AI 商业调研平台

基于 AI 智能体的商业调研应用，自动化构建人物画像、进行深度访谈并生成专业分析报告。

## 功能特性

### 核心功能
- **AI 人物画像生成** - 基于目标受众自动生成多样化的人物画像
- **自动化深度访谈** - AI 智能体自动与画像进行多轮对话
- **JTBD 行为分析** - 基于 Jobs-to-be-Done 框架的深度行为分析
- **专业报告生成** - 自动生成 McKinsey 风格的商业洞察报告
- **PDF 导出** - 支持将报告导出为 PDF 格式

### 技术亮点
- **多模型支持** - 支持 Gemini 2.5+、Kimi 2.5、Qwen、Deepseek 等主流模型
- **智能故障转移** - 自动切换备用模型，确保服务稳定性
- **中英双语** - 完整的国际化支持
- **响应式设计** - 适配桌面和移动设备

## 技术栈

| 层级 | 技术 |
|:---|:---|
| 前端 | React 19 + TypeScript + Tailwind CSS + Radix UI |
| 后端 | Node.js + Express + tRPC |
| 数据库 | SQLite + Drizzle ORM |
| AI 模型 | Gemini / Kimi / Qwen / Deepseek |
| 部署 | Docker + Zeabur/Railway |

## 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/happy80064-beep/ai-research-app.git
cd ai-research-app

# 2. 安装依赖 (需要 pnpm)
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的 API Key

# 4. 初始化数据库
pnpm run db:push

# 5. 启动开发服务器
pnpm run dev
```

应用将在 http://localhost:3000 运行

### 生产部署

#### Zeabur 部署 (推荐)

1. 在 [Zeabur](https://zeabur.com) 注册账号
2. 创建新项目并连接 GitHub 仓库
3. 在 "Variables" 中设置环境变量：
   - `JWT_SECRET`: 随机生成的密钥
   - `BUILT_IN_FORGE_API_KEY`: 你的 AI API Key
   - `DATABASE_URL`: `file:/app/data/sqlite.db`
4. 在 "Settings" -> "Volume" 中挂载 `/app/data` 路径
5. 部署完成

详细步骤请参考 [DEPLOY.md](./DEPLOY.md)

## 环境变量说明

| 变量名 | 必需 | 说明 |
|:---|:---|:---|
| `JWT_SECRET` | 是 | JWT 加密密钥 |
| `BUILT_IN_FORGE_API_KEY` | 是 | AI 模型 API Key |
| `DATABASE_URL` | 是 | 数据库文件路径 |
| `DEFAULT_MODEL` | 否 | 默认模型 (默认: gemini-2.5-pro) |
| `GEMINI_API_KEY` | 否 | Gemini 备用 Key |
| `KIMI_API_KEY` | 否 | Kimi 备用 Key |
| `QWEN_API_KEY` | 否 | Qwen 备用 Key |
| `DEEPSEEK_API_KEY` | 否 | Deepseek 备用 Key |

更多配置请参考 [.env.example](./.env.example)

## 项目结构

```
ai-research-app/
├── client/              # 前端代码
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── pages/       # 页面组件
│   │   ├── contexts/    # React Context
│   │   └── hooks/       # 自定义 Hooks
│   └── public/          # 静态资源
├── server/              # 后端代码
│   ├── _core/           # 核心模块
│   ├── routers.ts       # tRPC 路由
│   └── db.ts            # 数据库操作
├── drizzle/             # 数据库 schema
├── shared/              # 共享代码
└── Dockerfile           # 容器配置
```

## 安全最佳实践 🔒

### API Key 安全

⚠️ **重要**：AI 模型 API Key 只应在后端使用，切勿暴露给前端！

```
✅ 安全的调用流程：
用户浏览器 → tRPC API → 后端 → AI模型API（Key在这里）
     ↑                                    ↑
  无Key暴露                          Key安全存储
```

### 安全规则

1. **永远不要**以 `VITE_` 开头命名 API Key 变量（会暴露给前端）
2. **永远不要**提交包含真实 API Key 的 `.env` 文件到 Git
3. **永远不要**将 `.env` 文件上传到任何公开仓库

### 运行安全检查

```bash
# 检查是否有 API Key 泄露风险
pnpm run security:check
```

## API 文档

后端使用 tRPC 提供类型安全的 API，主要模块：

- `auth` - 用户认证
- `study` - 调研项目管理
- `persona` - 人物画像管理
- `interview` - 访谈管理
- `report` - 报告生成

## 模型配置

### 支持的模型

| 模型 | 标识符 | 特点 |
|:---|:---|:---|
| Gemini 2.5 Pro | `gemini-2.5-pro` | 首选，综合能力最强 |
| Gemini 3.0 Pro | `gemini-3.0-pro` | 最新版本 |
| Kimi 2.5 | `kimi-2.5` | 中文能力强 |
| Qwen Max | `qwen-max` | 阿里云，国内访问快 |
| Deepseek Reasoner | `deepseek-reasoner` | 推理能力强 |

### 自动故障转移

当首选模型不可用时，系统会自动按以下顺序切换：
```
Gemini 2.5+ → Kimi 2.5 → Qwen Max → Deepseek Reasoner
```

## 中国国内访问优化 🇨🇳

应用部署在美国 Zeabur 服务器，**中国用户无需 VPN 即可访问**：

### 为什么可以直连？

```
用户浏览器 → Zeabur 域名(国内可访问) → 美国服务器 → Gemini API
```

- ✅ Zeabur 域名在国内**可直接访问**
- ✅ AI 调用由**服务端完成**，用户不直接访问 Gemini
- ✅ 美国服务器可**自由访问**所有 AI API
- ✅ 多模型自动故障转移，确保稳定

### 推荐配置

```bash
# 首选 Gemini（最强能力）
DEFAULT_MODEL=gemini-2.5-pro
BUILT_IN_FORGE_API_KEY=your_key

# 备用模型（国内友好）
KIMI_API_KEY=your_kimi_key      # 中文能力强
QWEN_API_KEY=your_qwen_key      # 阿里云稳定
DEEPSEEK_API_KEY=your_ds_key    # 推理能力强
```

详细说明请参考 [CHINA_ACCESS_GUIDE.md](./CHINA_ACCESS_GUIDE.md)

## 开发计划

查看 [todo.md](./todo.md) 了解详细开发进度和计划。

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。
