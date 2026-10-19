# 郭鑫的学习笔记

独立的 Quartz 5 技术博客，以文章为中心，支持多标签、摘要、日期、少量置顶、归档、搜索、明暗主题和手机阅读。

**当前状态：本地博客与原版 Quartz Syncer 2.2.0 已安装配置；目标仓库为 sanbai0/hello-world，真实笔记未读取，首次推送与公开部署等待 Git 写入授权。**

## 预览

```powershell
cd C:\Users\admin\Desktop\guoxin\jl-blog
.\scripts\blog.ps1 preview
```

打开 `http://localhost:8080`，停止按 `Ctrl+C`。构建运行 `./scripts/blog.ps1 build`。本机准备了 nodejs.org 官方 Node 24 的项目内副本，不依赖 Codex；新电脑装 Node 24 LTS 后运行 `./scripts/blog.ps1 install`。macOS/Linux 使用 `npm ci && node quartz/bootstrap-cli.mjs plugin install`，然后 `npm run preview`。

名称、简介、可选 GitHub 链接和未来的 Pages 地址集中在 `blog.settings.ts`。

发布方式已确定：使用原版 Quartz Syncer 2.2.0 直接发布到 GitHub。日常只需在原库写作、设置 `publish: true`、到发布中心选择并确认；GitHub Actions 自动更新网站。无需额外本地审核或手动推送，也不修改插件。插件安装及首次公开范围已获确认，尚未完成实际上线。

预计 Pages 地址：`https://sanbai0.github.io/hello-world/`。原 master 分支及历史保留，博客使用新 main 分支。插件只管理 `content/学习总结`，避免把首页、归档和关于页列入撤稿。

`npm run audit:content` 保留为可选的严格结构诊断，不参与预览、构建或部署，不需要逐张维护附件清单。

- [中文使用指南](docs/使用指南.md)
- [Syncer 核验及隐私缺口](docs/syncer-audit.md)
- [验收记录](docs/验收记录.md)
- [首次公开确认清单](docs/首次公开清单.md)

全部文章都是明确标注的测试内容。没有真实简历、原库笔记、业务数据或 AI API。保留的 `docs/` 内 Quartz 官方文档只是上游参考，网站只构建 `content/`。

上游固定 [Quartz v5.0.0](https://github.com/jackyzha0/quartz/tree/v5.0.0)（`ab346fa66a895e12d63a308e70ce330ba795822a`），插件提交固定在 `quartz.lock.json`，MIT 许可保留于 `LICENSE.txt`。
