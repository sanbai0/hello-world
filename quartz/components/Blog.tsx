import { QuartzComponent, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { blog } from "../../blog.settings"
import {
  articleSequence,
  compareArticleDates,
  compareSeriesOrder,
  isPublishedArticle,
} from "./blogArticles"

const link = (p: QuartzComponentProps, slug: string) =>
  resolveRelative(p.fileData.slug!, slug as FullSlug)
const isLanding = (p: QuartzComponentProps) => ["index", "archive"].includes(p.fileData.slug!)

export const BlogNav: QuartzComponent = (p) => (
  <div class="blog-navigation">
    <a class="blog-wordmark internal" href={link(p, "index")} aria-label="回到首页">
      <span class="brand-seal">记</span>
      <span>
        {blog.title}
        <span class="wordmark-dot">.</span>
      </span>
    </a>
    <nav aria-label="主导航">
      {[
        ["index", "文章"],
        ["archive", "归档"],
        ["about", "关于"],
      ].map(([slug, text]) => (
        <a
          class="internal"
          aria-current={p.fileData.slug === slug ? "page" : undefined}
          href={link(p, slug)}
        >
          {text}
        </a>
      ))}
    </nav>
  </div>
)

export const BlogIntro: QuartzComponent = (p) => {
  if (p.fileData.slug !== "index") return null
  return (
    <section class="blog-intro">
      <p class="eyebrow">NOTES / LEARNING IN PUBLIC</p>
      <h1>{blog.title}</h1>
      <p class="intro-copy">{blog.description}</p>
      <div class="intro-rule">
        <span>记录 · 理解 · 实践</span>
        <span>持续积累中 ↗</span>
      </div>
    </section>
  )
}

export const BlogPosts: QuartzComponent = (p) => {
  if (!isLanding(p)) return null
  const archive = p.fileData.slug === "archive"
  const pages = p.allFiles.filter(isPublishedArticle).sort(compareArticleDates)
  const pinned = archive
    ? []
    : pages
        .filter(
          (f) =>
            f.frontmatter?.pinned === true ||
            (Array.isArray(f.frontmatter?.cssclasses) &&
              f.frontmatter.cssclasses.includes("pinned")),
        )
        .slice(0, blog.maxPinned)
  const series = blog.learningSeries
    .map((item) => ({
      ...item,
      posts: pages
        .filter((f) => f.slug!.startsWith(item.path) && !pinned.includes(f))
        .sort(compareSeriesOrder),
    }))
    .filter((item) => item.posts.length > 0)
  const recent = pages.filter((f) => !pinned.includes(f))
  let year = ""
  const postCard = (f: (typeof pages)[number]) => {
    const date =
      typeof f.frontmatter?.created === "string"
        ? f.frontmatter.created.slice(0, 10)
        : f.dates?.created
          ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(f.dates.created)
          : "日期待补充"
    const nextYear = date.slice(0, 4)
    const showYear = archive && nextYear !== year
    year = nextYear
    return (
      <>
        {showYear && <h3 class="archive-year">{year}</h3>}
        <article class="post-card">
          <div class="post-date">
            <time dateTime={date}>{date.replaceAll("-", ".")}</time>
            {pinned.includes(f) && <span class="pin">置顶</span>}
          </div>
          <div class="post-summary">
            <h3>
              <a class="internal" href={link(p, f.slug!)}>
                {f.frontmatter?.title}
                <span class="post-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </h3>
            <p>{String(f.frontmatter?.description ?? f.description ?? "")}</p>
            <div class="post-tags">
              {(f.frontmatter?.tags ?? []).map((tag) => (
                <a class="internal" href={link(p, `tags/${tag}`)}>
                  # {tag}
                </a>
              ))}
            </div>
          </div>
        </article>
      </>
    )
  }
  return (
    <section class="blog-posts" aria-label={archive ? "文章归档" : "文章列表"}>
      {archive ? (
        <>
          <div class="list-heading">
            <h1>文章归档</h1>
            <span>{pages.length.toString().padStart(2, "0")} 篇文章</span>
          </div>
          {pages.map(postCard)}
        </>
      ) : (
        <>
          {pinned.length > 0 && (
            <nav class="learning-start" aria-label="学习导航">
              <span class="learning-label">学习导航</span>
              {pinned.map((f) => (
                <a class="internal" href={link(p, f.slug!)}>
                  {f.frontmatter?.title} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </nav>
          )}
          {series.length > 0 && (
            <section class="learning-series" aria-label="按系列阅读">
              <div class="series-grid">
                {series.map((item) => (
                  <details class="series-card">
                    <summary class="series-heading">
                      <span class="series-name">{item.name}</span>
                      <span class="series-count">{item.posts.length} 篇</span>
                      <span class="series-chevron" aria-hidden="true">
                        ⌄
                      </span>
                    </summary>
                    <p class="series-description">{item.description}</p>
                    <ol>
                      {item.posts.map((f) => {
                        const number = articleSequence(f.slug!)
                        const ordinal = Number.isFinite(number)
                          ? number.toString().padStart(2, "0")
                          : "·"
                        const title = String(f.frontmatter?.title ?? "")
                        const prefix = `${item.name} ${ordinal}｜`
                        return (
                          <li value={Number.isFinite(number) ? number : undefined}>
                            <a class="internal" href={link(p, f.slug!)} aria-label={title}>
                              <span class="series-number" aria-hidden="true">
                                {ordinal}
                              </span>
                              <span>
                                {title.startsWith(prefix) ? title.slice(prefix.length) : title}
                              </span>
                            </a>
                          </li>
                        )
                      })}
                    </ol>
                  </details>
                ))}
              </div>
            </section>
          )}
          {recent.length > 0 && (
            <>
              <div class="list-heading">
                <h2>最近的记录</h2>
              </div>
              {recent.map(postCard)}
            </>
          )}
        </>
      )}
      {!pages.length && <p>第一篇记录，正在路上。</p>}
    </section>
  )
}

export const BlogPostNavigation: QuartzComponent = (p) => {
  if (!isPublishedArticle(p.fileData)) return null
  const series = blog.learningSeries.find((item) => p.fileData.slug!.startsWith(item.path))
  const articles = p.allFiles.filter(isPublishedArticle)
  const ordered = series
    ? articles.filter((f) => f.slug!.startsWith(series.path)).sort(compareSeriesOrder)
    : articles
        .filter((f) => !blog.learningSeries.some((item) => f.slug!.startsWith(item.path)))
        .sort(compareArticleDates)
        .reverse()
  const index = ordered.findIndex((f) => f.slug === p.fileData.slug)
  if (index < 0) return null
  const previous = ordered[index - 1]
  const next = ordered[index + 1]
  if (!previous && !next) return null
  return (
    <nav class="post-navigation" aria-label={series ? `${series.name}章节导航` : "文章翻页"}>
      {previous && (
        <a class="internal post-neighbor previous" rel="prev" href={link(p, previous.slug!)}>
          <span class="neighbor-label">← {series ? "上一章" : "上一篇"}</span>
          <span class="neighbor-title">{previous.frontmatter?.title}</span>
        </a>
      )}
      {next && (
        <a class="internal post-neighbor next" rel="next" href={link(p, next.slug!)}>
          <span class="neighbor-label">{series ? "下一章" : "下一篇"} →</span>
          <span class="neighbor-title">{next.frontmatter?.title}</span>
        </a>
      )}
    </nav>
  )
}

export function BlogComments(component: QuartzComponent): QuartzComponent {
  const Wrapped: QuartzComponent = (p) => {
    const comments = p.fileData.frontmatter?.comments
    if (!isPublishedArticle(p.fileData) || comments === false || comments === "false") return null
    return (
      <section class="blog-comments" aria-label="文章评论">
        <h2>评论</h2>
        <p class="comments-note">欢迎交流与补充。发表评论需要登录 GitHub，评论将公开显示。</p>
        {component(p)}
        <p class="comments-note">
          评论未加载时，可前往{" "}
          <a href="https://github.com/sanbai0/hello-world/discussions">GitHub 讨论区</a>。
        </p>
      </section>
    )
  }
  Object.assign(Wrapped, {
    css: component.css,
    beforeDOMLoaded: component.beforeDOMLoaded,
    afterDOMLoaded: component.afterDOMLoaded,
  })
  return Wrapped
}

export const BlogTOC: QuartzComponent = (p) => {
  if (isLanding(p) || !p.fileData.toc?.length) return null
  return (
    <details class="blog-toc" open>
      <summary>本文目录</summary>
      <ul>
        {p.fileData.toc.map((item) => (
          <li style={{ paddingLeft: `${Math.max(0, item.depth) * 12}px` }}>
            <a href={`#${item.slug}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export const BlogFooter: QuartzComponent = () => (
  <footer class="blog-footer">
    <span>
      © {new Date().getFullYear()} {blog.title}
    </span>
    <span>
      {blog.github && (
        <a href={blog.github} rel="me">
          GitHub ·{" "}
        </a>
      )}
      用文字留下思考 <span class="footer-dot">✳</span>
    </span>
    <a href="https://quartz.jzhao.xyz/">Built with Quartz</a>
  </footer>
)

export function ArticleOnly(component: QuartzComponent): QuartzComponent {
  const Wrapped: QuartzComponent = (p) => (isLanding(p) ? null : component(p))
  Object.assign(Wrapped, {
    css: component.css,
    beforeDOMLoaded: component.beforeDOMLoaded,
    afterDOMLoaded: component.afterDOMLoaded,
  })
  return Wrapped
}
