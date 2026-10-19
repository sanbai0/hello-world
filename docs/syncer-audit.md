# Quartz Syncer 核验与发布安全缺口

核验日期：2026-10-19。下文保留安装前的官方源码、发布包和文档核验记录，使用合成数据；当时未安装或连接远端。后续实际接入已经完成，当前状态以 [验收记录](验收记录.md) 为准。

后续接入进展：原版 2.2.0 已安装、接入凭据，并完成真实发布、更新、改名、撤稿和 Pages 线上核验；没有读取其他插件凭据或真实笔记正文。GitHub 目标为 sanbai0/hello-world，新 main 分支，输出范围为 content/学习总结。以下九项合成测试仍仅是源码核验证据，不把它们当成后来实际端到端测试。

**当前决定（2026-10-19）：用户了解以下附件行为后，选择直接使用原版 Quartz Syncer 2.2.0 远端发布，取消额外本地审核推送和提交前补丁要求。以下保留技术核验事实；历史补充方案不再是安装或发布的前置条件。**

## 版本、安装与兼容性

- 官方最新稳定发布为 **2.2.0**（2026-09-30，非预发布）。[发布页](https://github.com/saberzero1/quartz-syncer/releases/tag/2.2.0)
- 该版本要求 **Obsidian ≥ 1.13.0**，用户提供的 1.14.4 满足声明要求，现已安装并完成合成笔记的真实流程验收。[manifest](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/manifest.json#L5)
- 官方说明 Quartz v5 支持完整功能；v4 支持文章和媒体发布，但配置管理、插件管理和升级不可用。[版本对应 README](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/README.md)
- 官方 Obsidian 社区插件登记中存在 `quartz-syncer`，仓库为 `saberzero1/quartz-syncer`。优先从 Obsidian 社区插件界面安装；手动安装仅使用该官方 release 的 `main.js`、`manifest.json`、`styles.css`。[社区登记](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json)
- 下载的官方 `main.js` SHA-256：`D8DA78F7F07D95A40F63305D871630E597EE9BF40F06F37B9FAC9C2713EB0359`。

## Apply embeds 已不存在，不能套用旧设置教程

当前版本没有 `Apply embeds` 设置。官方 1.11.0 已删除插件端正文嵌入展开和设置控件，1.12.0 删除遗留 `applyEmbeds` 键。正文嵌入由 Quartz 构建端处理。旧文档页面还存在，不能据此声称已在 2.2.0 关闭此开关。[官方变更记录](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/docs/Changelog.md#L209)

当前静态 Markdown 编译器不读取 `![[未公开笔记]]` 的正文，但会保留这段引用及目标名称；`[[未公开笔记]]` 也保留名称。因此“没有上传关联笔记正文”不等于“没有泄露关联笔记的名称”。采用原版直接发布后，由作者在写作及发布中心确认内容；不会新增程序拦截。Quartz 仅能从发布副本中展开正文。

## 附件范围存在实质缺口

正文候选可由 `vaultPath` 限制在学习总结目录，并要求 `publish: true`；这个目录边界**不覆盖关联媒体**。

编译器会遍历 Obsidian 元数据里的 `embeds`，按扩展名自动选择图片、PDF、音视频、字体等附件，**不检查附件的 publish 标记、不限制其来源目录、没有文件或哈希许可白名单**。引用 `![[私人目录/秘密图片.png]]` 或 `![[原始简历.pdf]]` 会使附件成为待上传内容，即使附件在学习总结目录之外。[编译器](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/compiler/SyncerPageCompiler.ts#L451)、[附件扩展名](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/utils/mediaTypes.ts#L1)

`Publisher.publishBatch` 随后读取附件二进制，和文章一起交给写入后端。没有查到可配置的提交前隐私审查钩子。[提交前组装路径](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/publisher/Publisher.ts#L459)

未引用的图片不会被静态 Markdown 路径自动收集；但这不能保护被误引用的私人图片或 PDF。Dataview 等动态集成还可能产生额外内容与媒体，首版必须关闭。

原版 remote 模式没有“未许可附件在进入 Git 历史前自动硬阻止”的能力。GitHub Actions 发生在推送之后。用户已选择接受原版行为，取消额外拦截要求；可以继续准备远端接入，安装和首次公开动作仍按原定确认边界执行。

## 曾讨论的补充方案（未采用）

1. **原版 Syncer 本地目标 + 审核后提交推送**：使用插件原生 `publishTarget: local` 把发布副本写入独立博客目录；在任何 `git add/commit/push` 前检查全部文章、所有新旧引用及许可附件清单，通过后才提交推送。它不需要第二份手工写作库，也不改原文；但日常多了审核推送步骤，不能声称已实现“只在发布中心点一下就上线”。[本地后端只写文件](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/publisher/LocalPublishBackend.ts#L67)
2. **经确认的上游贡献或小补丁**：保留 Syncer 的发布中心和同步机制，在原有 `publishBatch` 的全部 Git 写入之前增加失败即阻断的检查：严格布尔 publish、目录边界、全部链接/嵌入公开性、允许的媒体目录及逐文件许可、实际字节哈希、禁用任意文件和动态展开。要覆盖缓存、批次部分失败、附件、撤稿后旧副本、改名等路径，并用隔离测试库及测试仓库验收。它能保持期望的一键日常流程，但属于插件改动，当前没有实施或安装。

以上两种补充方案均未采用。日常流程采用原版发布中心直接推送，不维护本地附件许可清单。事实上的附件行为保持原版，不再承诺额外的自动隐私拦截。

## 待安装阶段的建议配置

下面是可审查的设置意图，不是已写入用户库的配置：

| 设置                                    | 建议                                                                    | 原因                                    |
| --------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| `vaultPath`                             | 若库根是 Obsidian Vault 则为 `学习总结`；若该文件夹本身就是库根则为 `/` | 必须先确认实际库根                      |
| `publishFrontmatterKey`                 | `publish`                                                               | 用 Obsidian 复选框，严格使用布尔 `true` |
| `allNotesPublishableByDefault`          | `false`                                                                 | 不默认公开                              |
| `autoPublishInterval`                   | `0`                                                                     | 关闭定时上传                            |
| `autoPublishDynamicNotes`               | `false`                                                                 | 禁止自动发布动态结果                    |
| `useDataview`、`useDatacore` 及其他集成 | 均为 `false`                                                            | 默认 Dataview 其实开启，需主动关闭      |
| `allowArbitraryFilePublishing`          | `false`                                                                 | 不发布任意配置/文件                     |
| `arbitraryPublishPaths`                 | `[]`                                                                    | 无自定义上传路径                        |
| `includeAllFrontmatter`                 | `false`                                                                 | 防止私人属性整体上传                    |
| `manageSyncerStyles`                    | `false`                                                                 | 避免发布动作改样式源码                  |
| `autoCleanOrphanedMedia`                | `false`                                                                 | 首版撤稿时明确审核附件影响              |

2.2.0 没有自定义“附加属性白名单”。固定输出含 `publish: true`、标题、摘要、标签、时间、`cssclasses` 等；任意 `pinned` 属性会被过滤。可使用 `cssclasses: [pinned]` 表达置顶，并由博客首页识别，不应为了透传置顶字段打开全部 frontmatter。[属性编译](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/compiler/FrontmatterCompiler.ts#L79)

令牌在用户自己完成 GitHub 正规登录后生成，只授权目标仓库的 Contents 读写；已预建部署工作流且不使用 Syncer 建仓/创建工作流时，不授予 Workflows 写入。官方所列 Workflows 权限用于向导创建部署文件，不是普通发文必需。不要把令牌贴到聊天或写进仓库。[官方权限说明](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/docs/Settings/Git/Access%20Token.md#L43)

## 合成源码实测结果

运行：`node .local-audit/syncer-source-audit.cjs`。复用了博客的 esbuild，执行官方 2.2.0 的资产收集、链接转换、属性编译、候选筛选和发布状态分类原方法；Obsidian 文件与元数据为专门构造的假数据。无网络发布，无真实库读取。

| 用例                       | 结果                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| 未公开 Markdown 嵌入       | 没有收集正文或 `.md` 附件，但保留嵌入名                                        |
| 未公开普通双链             | 没有上传目标正文，但保留目标名                                                 |
| 目录外秘密 PNG、PDF 被嵌入 | **两者均被选为附件，确认原版的缺口**                                           |
| 未引用图片                 | 未收集                                                                         |
| 固定 frontmatter 白名单    | `publish`、标签、`cssclasses` 保留；任意 `pinned` 和私人属性过滤               |
| 学习总结目录筛选           | 仅目标目录内公开候选入选，同名前缀兄弟目录和私人目录排除                       |
| 中文文件名、同路径正文更新 | 中文路径保留，旧路径分类为一篇已修改文章，无新文章候选                         |
| 改名                       | 新路径是新候选，旧路径成为待撤稿项；需要同时确认这两个动作，旧网址不会自动维持 |
| 撤稿                       | 远端存在但当前候选中不存在的文章成为待删除项；仍需发布中心确认                 |

机器结果保留在 `.local-audit/syncer-synthetic-result.json`。发布状态与删除源码：[状态分类](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/publisher/PublishStatusManager.ts#L34)、[执行删除](https://github.com/saberzero1/quartz-syncer/blob/2.2.0/src/publisher/Publisher.ts#L774)。

这些是**源码方法级合成测试，不是 Obsidian 插件端到端验收**。没有验证实际元数据解析、AST 渲染、UI 选择、后台引擎、缓存、Git 传输、GitHub Actions 或公开站点更新。没有运行被替代的集成转换；测试不能证明这些未执行路径安全。

正式安装和配置获准后，应在隔离测试库/测试仓库再验证中文标题、公开图片、代码、公式、公开双链、未公开双链及嵌入、秘密 PNG/PDF、更新、改名及撤稿，并检查实际 Git 树与提交历史。撤稿只删除当前版本，不能抹除既有历史，因此敏感内容绝不能先推送再删除。
