/** Keep the locked upstream search implementation, scoped to this site's URL root. */
export function scopeSearchPaths(script: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/fetch\((["'])\/static\/contentIndex\.json\1\)/g, "fetch(__blogSearchIndex)"],
    [
      /new URL\((["'])\/\1\s*\+\s*([^,]+),\s*window\.location\.origin\)/g,
      "new URL(__blogSearchRoot+$2,window.location.origin)",
    ],
    [/(\.href\s*=\s*)(["'])\/\2\s*\+/g, "$1__blogSearchRoot+"],
  ]
  for (const [pattern, replacement] of replacements) {
    if ([...script.matchAll(pattern)].length !== 1) {
      throw new Error("Search upstream paths changed; review the project-path adapter before building.")
    }
    script = script.replace(pattern, replacement)
  }
  return `const __blogSearchIndex=new URL(document.querySelector('meta[name="blog-search-index"]').content,window.location.href);const __blogSearchRoot=new URL("../",__blogSearchIndex).pathname;\n${script}`
}
