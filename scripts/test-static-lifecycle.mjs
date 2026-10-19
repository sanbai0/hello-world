// 实际执行 Quartz 构建，验证合成笔记更新、改名、撤稿后的静态输出。
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
const base = path.resolve(`.local-tests/static-lifecycle-${Date.now()}`)
// Quartz 遵守 gitignore，输入放到新建的独立临时目录，避免忽略测试文件。
const input = fs.mkdtempSync(path.join(os.tmpdir(), "jl-blog-fixture-"))
const output = path.join(base, "public")
if (fs.existsSync(base)) throw new Error("请保留已有测试证据；重新运行前使用新的测试目录。")
fs.mkdirSync(base, { recursive: true })
fs.cpSync("content", input, { recursive: true })
const secret = "SYNTHETIC_PRIVATE_BODY_MUST_NOT_APPEAR_1901"
fs.writeFileSync(
  path.join(input, "学习总结/不公开合成笔记.md"),
  `---\ntitle: 合成未公开\npublish: false\n---\n${secret}`,
)
const results = []
const build = (label) => {
  const p = spawnSync(
    process.execPath,
    ["quartz/bootstrap-cli.mjs", "build", "-d", input, "-o", output],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
      },
    },
  )
  fs.writeFileSync(path.join(base, label + ".log"), p.stdout + p.stderr)
  assert.equal(p.status, 0, p.stdout + p.stderr)
  const walk = (d) =>
    fs
      .readdirSync(d, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  const readable = walk(output).filter((f) => /\.(html|json|xml)$/.test(f))
  assert(!readable.some((f) => fs.readFileSync(f, "utf8").includes(secret)), "合成未公开正文泄露")
  return readable
}
let files = build("01-initial")
const oldFile = files.find((f) => f.endsWith("测试-从问题到笔记.html"))
assert(oldFile, "中文文件名输出缺失")
assert(fs.readFileSync(oldFile, "utf8").includes("data-rehype-pretty-code"), "代码高亮缺失")
const formulaFile = files.find((f) => f.endsWith("测试-中文排版与公式.html"))
assert(fs.readFileSync(formulaFile, "utf8").includes("mjx-container"), "MathJax SVG 公式缺失")
results.push({ phase: "initial", result: "中文路径、代码高亮、SVG公式、未公开正文排除通过" })
const oldSource = path.join(input, "学习总结/测试-从问题到笔记.md")
fs.appendFileSync(oldSource, "\nLIFECYCLE_UPDATE_1902\n")
build("02-update")
assert(fs.readFileSync(oldFile, "utf8").includes("LIFECYCLE_UPDATE_1902"))
results.push({ phase: "update", result: "原路径内容更新，无新增路径" })
const newSource = path.join(input, "学习总结/测试-改名后的笔记.md")
fs.renameSync(oldSource, newSource)
files = build("03-rename")
assert(!fs.existsSync(oldFile), "改名后旧HTML残留")
const newFile = files.find((f) => f.endsWith("测试-改名后的笔记.html"))
assert(newFile)
results.push({ phase: "rename", result: "新中文路径生成、旧路径清除；旧链接需人工处理" })
fs.unlinkSync(newSource)
files = build("04-withdraw")
assert(!fs.existsSync(newFile), "撤稿后HTML残留")
const index = fs.readFileSync(path.join(output, "static/contentIndex.json"), "utf8")
assert(!index.includes("LIFECYCLE_UPDATE_1902"), "撤稿后索引残留")
results.push({ phase: "withdraw", result: "文章输出及搜索索引清除" })
fs.writeFileSync(path.join(base, "result.json"), JSON.stringify(results, null, 2))
console.log("4 个静态构建阶段通过；这是 Quartz 本地构建验收，不是 Syncer/GitHub 端到端验收。")
