/** 仓库/构建防线：不连接、不读取或同步 Obsidian。不能替代推送前隐私检查。 */
import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
const root = path.resolve(process.argv[2] ?? "content")
const policy = JSON.parse(fs.readFileSync("public-content.policy.json", "utf8"))
const errors = []
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const files = walk(root)
const rel = (f) => path.relative(root, f).replaceAll("\\", "/")
const notes = files.filter((f) => f.endsWith(".md"))
const publicNotes = new Map(notes.map((f) => [rel(f), matter(fs.readFileSync(f, "utf8"))]))
const media = policy.approvedMedia ?? []
const referenced = new Set()
function resolveTarget(from, raw) {
  let target = decodeURIComponent(raw.split("|")[0].split("#")[0].trim())
  if (!target) return null
  if (/^(?:https?:|data:|file:|\/\/)/i.test(target)) {
    errors.push(`${from}: 外部或内联资源需先单独确认：${target}`)
    return null
  }
  const direct = path.posix.normalize(path.posix.join(path.posix.dirname(from), target))
  const candidates = [direct, direct + ".md", target, target + ".md"]
  for (const c of candidates) if (files.some((f) => rel(f) === c)) return c
  const matches = files
    .map(rel)
    .filter((f) => [target, target + ".md"].includes(path.posix.basename(f)))
  if (matches.length === 1) return matches[0]
  errors.push(`${from}: 关联目标不存在或不唯一：${target}`)
  return null
}
for (const f of files) {
  const name = rel(f)
  if (name === ".gitkeep") continue
  if (/(^|\/)(\.|node_modules)|(?:简历|resume|credential|secret|token)/i.test(name))
    errors.push(`禁止公开的文件或路径：${name}`)
  if (!f.endsWith(".md") && !media.includes(name)) errors.push(`附件未经逐文件确认：${name}`)
}
for (const [name, note] of publicNotes) {
  if (note.data.publish !== true) errors.push(`${name}: 缺少明确 publish: true`)
  if (!policy.sitePages.includes(name) && !name.startsWith(policy.notesPrefix))
    errors.push(`${name}: 不在允许的学习总结目录`)
  if (Object.keys(note.data).some((k) => !policy.allowedFrontmatter.includes(k)))
    errors.push(`${name}: 存在未允许的 frontmatter 字段`)
  if (
    /<(?:script|iframe|object|embed|img|a|video|audio|source|svg)\b|\b(?:src|href|style)\s*=|<\s*!--/i.test(
      note.content,
    )
  )
    errors.push(`${name}: HTML/隐藏注释不在安全发布语法范围`)
  const text = note.content.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g, "")
  for (const match of text.matchAll(/(!?)\[\[([^\]]+)\]\]/g)) {
    const target = resolveTarget(name, match[2])
    if (!target) continue
    if (target.endsWith(".md")) {
      if (match[1]) errors.push(`${name}: 首版禁止笔记正文嵌入，请改为公开文章链接：${target}`)
      if (publicNotes.get(target)?.data.publish !== true)
        errors.push(`${name}: 链接到未公开笔记：${target}`)
    } else {
      referenced.add(target)
      if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(target))
        errors.push(`${name}: 首版仅允许已确认的公开图片：${target}`)
    }
  }
  for (const match of text.matchAll(/(!?)\[[^\]]*\]\(([^)]+)\)/g)) {
    const targetText = match[2].trim().replace(/^<|>$/g, "")
    if (!match[1] && /^(https?:|mailto:|#)/i.test(targetText)) continue
    const target = resolveTarget(name, targetText)
    if (target && !target.endsWith(".md")) referenced.add(target)
    if (target?.endsWith(".md") && publicNotes.get(target)?.data.publish !== true)
      errors.push(`${name}: 关联未公开笔记：${target}`)
  }
  if (/^\s*\[[^\]]+\]:/m.test(text))
    errors.push(`${name}: 引用式链接需先改为普通 Markdown 链接并检查`)
}
for (const name of media) {
  if (!files.some((f) => rel(f) === name)) errors.push(`批准的附件不存在：${name}`)
  if (!referenced.has(name)) errors.push(`未被公开文章引用的附件：${name}`)
}
if (errors.length) {
  console.error(
    "公开内容检查失败（这些检查发生在仓库内，不能撤销已经上传的文件）：\n" +
      errors.map((e) => `- ${e}`).join("\n"),
  )
  process.exit(1)
}
console.log(
  `公开内容检查通过：${notes.length} 个 Markdown，${media.length} 个逐文件确认且被引用的附件。`,
)
