import path from "node:path"
import { visit } from "unist-util-visit"
import type { Root } from "hast"
import type { QuartzTransformerPlugin } from "../types"
import { slugifyFilePath, type FilePath, type FullSlug } from "../../util/path"

// Syncer strips vaultPath from links, while copies live under content/学习总结.
// Resolve only existing public-copy paths before CrawlLinks makes URLs relative.
export const SyncerScopedLinks: QuartzTransformerPlugin = () => ({
  name: "SyncerScopedLinks",
  htmlPlugins(ctx) {
    const scope = "学习总结"
    const known = new Set(ctx.allSlugs)
    return [
      () => (tree: Root, file) => {
        const source = file.data.slug as FullSlug
        if (!source.startsWith(`${scope}/`)) return
        visit(tree, "element", (node) => {
          const property = node.tagName === "a" ? "href" : "src"
          if (!["a", "img", "video", "audio", "iframe"].includes(node.tagName)) return
          const target = node.properties?.[property]
          if (typeof target !== "string" || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) return
          const match = target.match(/^([^?#]+)(.*)$/)
          if (!match) return
          let decoded: string
          try {
            decoded = decodeURI(match[1])
          } catch {
            return
          }
          const absolute = decoded.startsWith("/")
          const explicitRelative = /^\.{1,2}\//.test(decoded)
          const raw = decoded.replace(/^\//, "")
          const slug = (value: string) => slugifyFilePath(path.posix.normalize(value) as FilePath)
          const scoped = slug(`${scope}/${raw}`)
          const root = slug(raw)
          const relative = slug(path.posix.join(path.posix.dirname(source), raw))
          const candidates = absolute
            ? [root]
            : explicitRelative
              ? [relative, scoped, root]
              : [scoped, root, relative]
          const resolved = candidates.find((candidate) => known.has(candidate))
          if (resolved) node.properties[property] = resolved + match[2]
        })
      },
    ]
  },
})
