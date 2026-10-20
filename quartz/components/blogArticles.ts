import type { QuartzPluginData } from "../plugins/vfile"

export const isPublishedArticle = (file: QuartzPluginData) =>
  file.frontmatter?.publish === true &&
  !!file.slug &&
  !["index", "archive", "about"].includes(file.slug)

export const compareArticleDates = (a: QuartzPluginData, b: QuartzPluginData) =>
  (b.dates?.created?.getTime() ?? 0) - (a.dates?.created?.getTime() ?? 0) ||
  a.slug!.localeCompare(b.slug!)

export const articleSequence = (slug: string) =>
  Number(
    slug
      .split("/")
      .pop()
      ?.match(/^(\d+)-/)?.[1],
  )

export const compareSeriesOrder = (a: QuartzPluginData, b: QuartzPluginData) => {
  const left = articleSequence(a.slug!)
  const right = articleSequence(b.slug!)
  return (
    (Number.isFinite(left) ? left : Number.MAX_SAFE_INTEGER) -
      (Number.isFinite(right) ? right : Number.MAX_SAFE_INTEGER) ||
    a.slug!.localeCompare(b.slug!, undefined, { numeric: true })
  )
}
