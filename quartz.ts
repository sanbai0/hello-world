import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import {
  ArticleOnly,
  BlogNav,
  BlogIntro,
  BlogPosts,
  BlogTOC,
  BlogFooter,
} from "./quartz/components/Blog"
import { blog } from "./blog.settings"
import { QuartzComponent } from "./quartz/components/types"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes"

const config = await loadQuartzConfig({ pageTitle: blog.title, baseUrl: blog.baseUrl || undefined })
export default config
const base = await loadQuartzLayout()
const BlogHead: QuartzComponent = (p) =>
  base.defaults.head!({
    ...p,
    fileData:
      p.fileData.slug === "index"
        ? {
            ...p.fileData,
            frontmatter: {
              ...p.fileData.frontmatter,
              tags: p.fileData.frontmatter?.tags ?? [],
              title: blog.title,
              description: blog.description,
            },
          }
        : p.fileData,
  })
const defaults = {
  ...base.defaults,
  head: BlogHead,
  header: [BlogNav, ...(base.defaults.left ?? [])],
  left: [],
  right: [],
  beforeBody: [BlogIntro, ...(base.defaults.beforeBody ?? []).map(ArticleOnly), BlogTOC],
  afterBody: [BlogPosts],
  footer: BlogFooter,
  frame: "full-width",
}
export const layout = {
  defaults,
  byPageType: Object.fromEntries(
    ["content", "folder", "tag", "404"].map((type) => [type, defaults]),
  ),
}
// v5.0.0 的配置加载器已创建默认 Dispatcher，显式替换为本博客布局。
config.plugins.emitters = config.plugins.emitters.filter((e) => e.name !== "PageTypeDispatcher")
config.plugins.emitters.push(PageTypeDispatcher(layout))
