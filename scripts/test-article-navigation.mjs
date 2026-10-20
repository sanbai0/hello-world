// 实际静态构建：系列编号、跨系列边界、普通文章日期和首尾文章。
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"

const input = fs.mkdtempSync(path.join(os.tmpdir(), "blog-navigation-"))
const output = path.resolve(`.local-tests/navigation-${Date.now()}`)
function write(slug, created = "2026-10-20", publish = true) {
  const file = path.join(input, slug + ".md")
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(
    file,
    `---\ntitle: ${slug}\ncreated: ${created}\npublish: ${publish}\n---\n合成导航验收。\n`,
  )
}
for (const slug of [
  "index",
  "archive",
  "about",
  "学习总结/Agent/01-开始",
  "学习总结/Agent/02-继续",
  "学习总结/Agent/10-结束",
  "学习总结/RAG/01-独立系列",
])
  write(slug)
write("学习总结/较早的文章", "2025-01-01")
write("学习总结/较新的文章", "2026-01-01")
write("学习总结/Agent/03-未公开", "2026-10-20", false)
const result = spawnSync(
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
assert.equal(result.status, 0, result.stdout + result.stderr)
function links(slug) {
  const html = fs.readFileSync(path.join(output, slug + ".html"), "utf8")
  const nav = html.match(/<nav class="post-navigation"[\s\S]*?<\/nav>/)?.[0] ?? ""
  return [...nav.matchAll(/rel="(prev|next)" href="([^"]+)"/g)].map(([, rel, href]) => [
    rel,
    decodeURI(new URL(href, `https://fixture/hello-world/${slug}`).pathname).replace(
      "/hello-world/",
      "",
    ),
  ])
}
assert.deepEqual(links("学习总结/Agent/01-开始"), [["next", "学习总结/Agent/02-继续"]])
assert.deepEqual(links("学习总结/Agent/02-继续"), [
  ["prev", "学习总结/Agent/01-开始"],
  ["next", "学习总结/Agent/10-结束"],
])
assert.deepEqual(links("学习总结/Agent/10-结束"), [["prev", "学习总结/Agent/02-继续"]])
assert.deepEqual(links("学习总结/RAG/01-独立系列"), [])
assert.deepEqual(links("学习总结/较早的文章"), [["next", "学习总结/较新的文章"]])
assert.deepEqual(links("学习总结/较新的文章"), [["prev", "学习总结/较早的文章"]])
for (const slug of ["index", "archive", "about"]) assert.deepEqual(links(slug), [])
assert(!fs.existsSync(path.join(output, "学习总结/Agent/03-未公开.html")))
console.log(
  "导航真实构建通过：系列按编号且不串系列、普通文章按日期、首尾隐藏、非文章和未公开内容排除。",
)
