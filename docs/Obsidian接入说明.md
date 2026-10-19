# 原版 Quartz Syncer 接入方案

用户已选择直接使用原版 Quartz Syncer 2.2.0 远端发布。项目预览、构建和部署不再运行额外的附件许可检查，也不增加本地审核推送流程。

## 已确认并完成的 Obsidian 变更

目标库：`C:\Users\admin\Documents\Obsidian Vault`。发布正文仅限其中 `学习总结`。用户报告 Obsidian 版本 1.14.4。

用户已确认安装，以下文件及设置已写入；插件已加载、令牌已接入，连接测试和实际新增、同路径更新、改名、撤稿均通过。验收使用官方 CLI 调用原版发布中心的选择及发布/删除处理接口，真实经过元数据、缓存、Git、Actions 和公开网站，没有修改插件源码。详见验收记录：

1. 从 `saberzero1/quartz-syncer` 官方 2.2.0 release 安装原版 `main.js`、`manifest.json`、`styles.css`，写入该库 `.obsidian/plugins/quartz-syncer/`。不修改插件源码。
2. 备份并在 `.obsidian/community-plugins.json` 中加入 `quartz-syncer`，保留已有插件；只读取及修改这份插件列表和 Quartz Syncer 自己的配置，不读取其他插件的 data.json。
3. 在 Quartz Syncer 自己的 `data.json` 中写非敏感设置，见下表。GitHub 账号为 sanbai0，仓库 hello-world；永久令牌通过本机内存通道交给原版 SecretStorage，不进入聊天、源码、data.json 或 Git。插件报告可选 Electron 加密层未启用，不能把此环境描述为插件加密存储。

| 设置                                    | 值                                           |
| --------------------------------------- | -------------------------------------------- |
| `publishTarget`                         | `remote`                                     |
| `gitRemoteUrl`                          | `https://github.com/sanbai0/hello-world.git` |
| `gitBranch`                             | `main`                                       |
| `vaultPath`                             | `学习总结`                                   |
| `contentFolder`                         | `content/学习总结`                           |
| `publishFrontmatterKey`                 | `publish`                                    |
| `allNotesPublishableByDefault`          | `false`                                      |
| `autoPublishInterval`                   | `0`                                          |
| `autoPublishDynamicNotes`               | `false`                                      |
| `useDataview`、`useDatacore` 等动态集成 | `false`                                      |
| `includeAllFrontmatter`                 | `false`                                      |
| `allowArbitraryFilePublishing`          | `false`                                      |
| `arbitraryPublishPaths`                 | `[]`                                         |
| `manageSyncerStyles`                    | `false`（保留本站样式）                      |
| `autoCleanOrphanedMedia`                | `false`                                      |

以上是原版已有设置，不添加审核插件、补丁、定时任务或保存即上传。2.2.0 没有 Apply embeds 设置，不伪造或写入该键。

验收期间临时启用了原版内置测试接口，完成后已关闭；重新加载后确认插件仍有凭据，autoPublish=false，待处理队列为0。普通命令 `Quartz Syncer: Open Publication Center`（ID 为 `quartz-syncer:open-publish-modal`）可用。

Remotely Save、坚果云、已有同步凭据及原笔记正文不在修改范围。原社区插件列表已单独备份到项目忽略目录 `.local-tools/obsidian-backups/`，已有条目顺序和内容均保留。三个原版发布文件已逐一对照 GitHub release 的 SHA-256，安装后再次校验一致。

输出目录采用 `content/学习总结`：原版会剥离来源目录前缀，再拼接输出目录，所以原库 `学习总结/文章.md` 正好映射到 `content/学习总结/文章.md`。首页、归档、关于及站点素材位于插件管理范围外，不会成为它的远端撤稿候选。

子目录图片和双链的来源前缀也会被剥离，因此本站在 Quartz 构建端恢复已存在公开副本的路径，再交给标准链接处理器。该适配不读取原库、不改上传文件、不展开未公开正文，也不增加日常操作。

## 接通后日常操作

在原有学习总结里写作或修改 → 设置 `publish: true` → 发布中心选中新增/修改/撤稿并确认 → 插件直接更新 GitHub → Actions 更新博客。无需另存笔记、维护图片清单或手动推送文章。被引用附件按原版规则随文章处理。

第一次公开范围已确认：目标为 sanbai0/hello-world，新 main 分支保留原 master；三篇测试文章和关于页占位保留。Git 写入与插件令牌已配置，令牌不设过期日，权限仅 Contents 读写和 Metadata 只读。参考 [公开清单](首次公开清单.md)。
