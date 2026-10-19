// 回归：Syncer 剥离来源前缀后，子目录图片和双链必须指向真实公开副本。
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"

const input = fs.mkdtempSync(path.join(os.tmpdir(), "jl-blog-links-"))
const output = path.resolve(`.local-tests/syncer-links-${Date.now()}`)
const write = (relative, text) => {
  const file = path.join(input, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}
write("about.md", "---\npublish: true\ntitle: 关于\n---\n合成关于页")
write("学习总结/嵌套/目标.md", "---\npublish: true\ntitle: 合成目标\n---\nLINK_TARGET")
write("学习总结/公开附件/同名.svg", '<svg xmlns="http://www.w3.org/2000/svg"/>')
write("assets/同名.svg", '<svg xmlns="http://www.w3.org/2000/svg"/>')
write(
  "学习总结/适配回归/文章.md",
  "---\npublish: true\ntitle: 链接回归\n---\n![[公开附件/同名.svg]]\n\n[[嵌套/目标|目标双链]]\n\n[关于](../../about.md)\n",
)
const result = spawnSync(
  process.execPath,
  ["quartz/bootstrap-cli.mjs", "build", "-d", input, "-o", output],
  { encoding: "utf8", env: { ...process.env, PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH } },
)
assert.equal(result.status, 0, result.stdout + result.stderr)
const page = "学习总结/适配回归/文章.html"
const html = fs.readFileSync(path.join(output, page), "utf8")
const actual = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) =>
  decodeURI(new URL(match[1], "https://fixture/" + page).pathname).slice(1),
)
for (const target of ["学习总结/公开附件/同名.svg", "学习总结/嵌套/目标", "about"]) {
  assert(actual.includes(target), `缺少正确目标：${target}`)
  assert(fs.existsSync(path.join(output, target)) || fs.existsSync(path.join(output, target + ".html")))
}
console.log("实际 Quartz 构建通过：同名图片按目录解析、嵌套双链和显式相对关于链接均正确。")
