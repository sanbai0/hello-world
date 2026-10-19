// 对应用户明确提出的泄露风险，只使用人工合成内容，不打开原笔记库。
import fs from "node:fs"
import path from "node:path"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
const root = path.resolve(`.local-tests/content-boundary-${Date.now()}`)
fs.mkdirSync(root, { recursive: true })
const original = "学习总结/测试-从问题到笔记.md"
const assets = "学习总结/博客公开附件"
const cases = [
  ["正常公开副本", false, () => {}],
  [
    "未公开笔记嵌入",
    true,
    (d) => fs.appendFileSync(path.join(d, original), "\n![[未公开合成笔记]]\n"),
  ],
  [
    "未公开普通双链",
    true,
    (d) => fs.appendFileSync(path.join(d, original), "\n[[未公开合成笔记]]\n"),
  ],
  [
    "未批准图片",
    true,
    (d) => {
      fs.copyFileSync(path.join(d, assets, "公开测试图.svg"), path.join(d, assets, "未批准.svg"))
      fs.appendFileSync(path.join(d, original), "\n![[未批准.svg]]\n")
    },
  ],
  [
    "原始简历附件",
    true,
    (d) => {
      fs.writeFileSync(path.join(d, assets, "原始简历.pdf"), "SYNTHETIC_PRIVATE_PDF")
      fs.appendFileSync(path.join(d, original), "\n![[原始简历.pdf]]\n")
    },
  ],
  [
    "未引用附件",
    true,
    (d) => fs.writeFileSync(path.join(d, assets, "无引用.png"), "SYNTHETIC_IMAGE"),
  ],
  [
    "缺少公开标记",
    true,
    (d) => {
      const f = path.join(d, original)
      fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace("publish: true", "publish: false"))
    },
  ],
  [
    "HTML 嵌入",
    true,
    (d) =>
      fs.appendFileSync(
        path.join(d, original),
        '\n<iframe src="https://example.com/private"></iframe>\n',
      ),
  ],
]
const evidence = []
for (const [name, blocked, change] of cases) {
  const d = path.join(root, String(evidence.length))
  fs.cpSync("content", d, { recursive: true })
  change(d)
  const r = spawnSync(process.execPath, ["scripts/check-public-content.mjs", d], {
    encoding: "utf8",
  })
  assert.equal(r.status !== 0, blocked, `${name}\n${r.stdout}\n${r.stderr}`)
  evidence.push({ name, expected: blocked ? "blocked" : "allowed", result: "passed" })
}
fs.writeFileSync(path.join(root, "result.json"), JSON.stringify(evidence, null, 2))
console.log(`公开副本结构检查：${evidence.length} 个合成场景通过。此检查不是 Syncer 提交前防线。`)
