#!/usr/bin/env node

/**
 * 安全预提交检查脚本
 * 用于检查是否有 API Key 或其他敏感信息泄露风险
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// 敏感模式列表
const sensitivePatterns = [
  // API Keys
  { pattern: /VITE_[A-Z_]*API_KEY\s*=/, name: 'VITE_ prefix API Key', severity: 'error' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'Secret Key (sk-...)', severity: 'error' },
  { pattern: /sk-proj-[a-zA-Z0-9]{20,}/, name: 'Project Secret Key', severity: 'error' },
  { pattern: /sk-test-[a-zA-Z0-9]{20,}/, name: 'Test Secret Key', severity: 'error' },
  { pattern: /sk-live-[a-zA-Z0-9]{20,}/, name: 'Live Secret Key', severity: 'error' },

  // Private Keys
  { pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, name: 'Private Key', severity: 'error' },

  // JWT Secrets (如果看起来像真实值而非占位符)
  { pattern: /JWT_SECRET\s*=\s*["\'][^"\']{10,}["\']/, name: 'JWT Secret (可能真实)', severity: 'warning' },

  // AWS Keys
  { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key ID', severity: 'error' },

  // Database URLs with passwords
  { pattern: /:\/\/[^:]+:[^@]+@[^/]+\//, name: 'Database URL with password', severity: 'error' },
];

// 要扫描的文件路径
const scanPaths = [
  'client/src',
  'server',
  'shared',
];

// 忽略的文件/目录
const ignoreList = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.test.ts',
  '.spec.ts',
  'security-check.js',
];

// 文件扩展名白名单
const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.env.example', '.md'];

function shouldIgnore(filePath) {
  const fileName = path.basename(filePath);

  // 检查忽略列表
  if (ignoreList.some(ignore => filePath.includes(ignore) || fileName === ignore)) {
    return true;
  }

  // 检查文件扩展名
  const ext = path.extname(filePath);
  if (ext && !allowedExtensions.includes(ext)) {
    return true;
  }

  return false;
}

function scanFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      sensitivePatterns.forEach(({ pattern, name, severity }) => {
        if (pattern.test(line)) {
          // 排除注释行
          if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
            return;
          }

          // 排除占位符
          if (/your_.*_here|example|placeholder|xxx|xxx|changeme/i.test(line)) {
            return;
          }

          issues.push({
            line: index + 1,
            content: line.trim().substring(0, 80),
            pattern: name,
            severity,
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
  }

  return issues;
}

function scanDirectory(dir) {
  const results = [];

  function walk(currentPath) {
    if (shouldIgnore(currentPath)) {
      return;
    }

    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(currentPath);
      entries.forEach(entry => {
        walk(path.join(currentPath, entry));
      });
    } else if (stat.isFile()) {
      const issues = scanFile(currentPath);
      if (issues.length > 0) {
        results.push({ file: currentPath, issues });
      }
    }
  }

  walk(dir);
  return results;
}

function main() {
  console.log(`${colors.blue}🔒 Security Check Started${colors.reset}\n`);

  const rootDir = path.resolve(__dirname, '..');
  let totalErrors = 0;
  let totalWarnings = 0;

  scanPaths.forEach(scanPath => {
    const fullPath = path.join(rootDir, scanPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const results = scanDirectory(fullPath);

    results.forEach(({ file, issues }) => {
      const relativePath = path.relative(rootDir, file);
      console.log(`${colors.yellow}📁 ${relativePath}${colors.reset}`);

      issues.forEach(({ line, content, pattern, severity }) => {
        const color = severity === 'error' ? colors.red : colors.yellow;
        const icon = severity === 'error' ? '❌' : '⚠️';

        console.log(`  ${icon} ${color}Line ${line}: ${pattern}${colors.reset}`);
        console.log(`     ${content}`);

        if (severity === 'error') {
          totalErrors++;
        } else {
          totalWarnings++;
        }
      });

      console.log('');
    });
  });

  // 检查 .env 文件是否被提交
  const envFile = path.join(rootDir, '.env');
  if (fs.existsSync(envFile)) {
    console.log(`${colors.yellow}⚠️  Warning: .env file exists in repository${colors.reset}`);
    console.log('   Make sure it\'s listed in .gitignore and not committed\n');
    totalWarnings++;
  }

  // 总结
  console.log(`${colors.blue}📊 Security Check Summary${colors.reset}`);
  console.log(`   Errors: ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);
  console.log(`   Warnings: ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`);

  if (totalErrors > 0) {
    console.log(`\n${colors.red}❌ Security check failed! Please fix the errors above.${colors.reset}`);
    console.log(`${colors.yellow}💡 Tip: Never commit API keys or secrets to Git!${colors.reset}\n`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n${colors.yellow}⚠️  Security check passed with warnings.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}✅ Security check passed! No issues found.${colors.reset}\n`);
    process.exit(0);
  }
}

main();
