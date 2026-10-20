import { QuartzComponent, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { blog } from "../../blog.settings"

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
  const pages = p.allFiles
    .filter(
      (f) => f.frontmatter?.publish === true && !["index", "about", "archive"].includes(f.slug!),
    )
    .sort(
      (a, b) =>
        (b.dates?.created?.getTime() ?? 0) - (a.dates?.created?.getTime() ?? 0) ||
        a.slug!.localeCompare(b.slug!),
    )
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
  const sequence = (slug: string) =>
    Number(
      slug
        .split("/")
        .pop()
        ?.match(/^(\d+)-/)?.[1],
    )
  const series = blog.learningSeries
    .map((item) => ({
      ...item,
      posts: pages
        .filter((f) => f.slug!.startsWith(item.path) && !pinned.includes(f))
        .sort((a, b) => {
          const left = sequence(a.slug!)
          const right = sequence(b.slug!)
          return (
            (Number.isFinite(left) ? left : Number.MAX_SAFE_INTEGER) -
              (Number.isFinite(right) ? right : Number.MAX_SAFE_INTEGER) ||
            a.slug!.localeCompare(b.slug!, undefined, { numeric: true })
          )
        }),
    }))
    .filter((item) => item.posts.length > 0)
  const grouped = new Set(series.flatMap((item) => item.posts))
  const recent = pages.filter((f) => !pinned.includes(f) && !grouped.has(f))
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
            <div class="learning-start">
              <div class="list-heading">
                <h2>学习导航</h2>
                <span>{pages.length.toString().padStart(2, "0")} 篇文章</span>
              </div>
              {pinned.map(postCard)}
            </div>
          )}
          {series.length > 0 && (
            <section class="learning-series" aria-label="按系列阅读">
              <div class="list-heading">
                <h2>按系列阅读</h2>
                <a class="internal series-archive" href={link(p, "archive")}>
                  按日期查看全部 ↗
                </a>
              </div>
              <div class="series-grid">
                {series.map((item) => (
                  <section class="series-card" aria-label={item.name}>
                    <div class="series-heading">
                      <h3>{item.name}</h3>
                      <span>{item.posts.length} 篇 · 按编号阅读</span>
                    </div>
                    <p class="series-description">{item.description}</p>
                    <ol>
                      {item.posts.map((f) => {
                        const number = sequence(f.slug!)
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
                  </section>
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
