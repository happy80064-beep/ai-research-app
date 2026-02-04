# 故障排除指南

## 问题：insertBefore 错误

### 错误信息
```
NotFoundError: Failed to execute 'insertBefore' on 'Node':
The node before which the new node is to be inserted is not a child of this node.
```

### 原因

这个错误通常由以下原因引起：

1. **浏览器扩展干扰**（最常见）
   - 翻译扩展（如 Google Translate、沉浸式翻译）
   - 广告拦截器
   - 密码管理器
   - React DevTools（某些版本）

2. **HTML 结构问题**
   - HTML 注释块
   - 不规范的标签嵌套

3. **React Hydration 不匹配**
   - 服务端渲染和客户端渲染内容不一致

### 解决方案

#### 方案 1：禁用浏览器扩展（临时测试）

1. 打开浏览器无痕模式（Incognito/Private 模式）
2. 访问你的应用
3. 如果正常工作，说明是某个扩展导致的问题
4. 逐个禁用扩展，找出罪魁祸首

常见引起问题的扩展：
- Google Translate（自动翻译页面）
- 沉浸式翻译
- Grammarly
- 广告拦截器（AdBlock、uBlock）
- React Developer Tools（旧版本）

#### 方案 2：更新应用到最新版本（已修复）

最新的代码已包含修复：

1. **清理 HTML 结构**
   - 移除所有 HTML 注释块
   - 简化 index.html

2. **健壮的渲染逻辑**
   ```typescript
   // 清除浏览器扩展可能插入的内容
   while (rootElement.firstChild) {
     rootElement.removeChild(rootElement.firstChild);
   }
   ```

3. **错误抑制**
   ```typescript
   // 忽略浏览器扩展引起的错误
   window.addEventListener("error", (event) => {
     if (event.message?.includes("insertBefore")) {
       event.preventDefault();
     }
   });
   ```

**更新步骤：**

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
pnpm install
pnpm run build

# 3. 重新部署到 Zeabur
git push origin main
```

#### 方案 3：Zeabur 重新部署

如果你已经部署到 Zeabur：

1. 等待代码自动部署（约 2 分钟）
2. 或者手动触发：
   - 进入 Zeabur Dashboard
   - 找到你的服务
   - 点击 "Redeploy"

3. 强制刷新浏览器（Ctrl+Shift+R 或 Cmd+Shift+R）
4. 清除浏览器缓存

#### 方案 4：使用 iframe 隔离（极端情况）

如果用户必须使用有问题的扩展，可以将应用嵌入 iframe：

```html
<iframe src="https://your-app.zeabur.app" sandbox="allow-scripts allow-same-origin">
</iframe>
```

### 验证修复

修复后，打开浏览器控制台，你应该看到：

```
# 不再出现 insertBefore 错误
# 如果出现，会被捕获并显示为警告：
Browser extension error suppressed: ...
```

### 预防措施

1. **使用无痕模式测试**
   - 在无痕模式下验证应用是否正常工作

2. **添加监控**
   - 使用 Sentry 等错误监控服务
   - 区分浏览器扩展错误和应用错误

3. **用户提示**
   - 在应用中添加提示：
   ```
   如果遇到问题，请尝试禁用浏览器扩展或无痕模式访问
   ```

### 相关链接

- React Issue: https://github.com/facebook/react/issues/11538
- Chrome Extension 干扰: https://stackoverflow.com/questions/48104433
- React Hydration: https://react.dev/reference/react-dom/client/hydrateRoot

---

## 其他常见问题

### 问题：API 调用失败

**检查清单：**
- [ ] 环境变量是否正确配置
- [ ] API Key 是否有效
- [ ] 访问 `/api/trpc/system.modelStatus` 查看模型状态
- [ ] 检查 Zeabur Logs 查看错误信息

### 问题：数据库数据丢失

**检查清单：**
- [ ] Volume 是否正确挂载到 `/app/data`
- [ ] DATABASE_URL 是否为 `file:/app/data/sqlite.db`
- [ ] 重新部署后数据是否仍然存在

### 问题：国内访问慢

**解决方案：**
- 使用 Kimi/Qwen 作为备用模型
- 配置 Cloudflare CDN
- 考虑使用自定义域名

---

**如果问题持续存在，请提供：**
1. 浏览器版本
2. 安装的扩展列表
3. 完整的错误堆栈
4. 是否能在无痕模式下复现
