import fs from "node:fs"
const source = fs.readFileSync("blog.settings.ts", "utf8")
const address = source.match(/baseUrl:\s*"([^"]*)"/)?.[1]
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/")
const expected =
  repo?.toLowerCase() === `${owner?.toLowerCase()}.github.io`
    ? `${owner}.github.io`
    : `${owner}.github.io/${repo}`
if (!address || address.toLowerCase() !== expected.toLowerCase()) {
  throw new Error(
    `首次部署前请确认账号和仓库，并将 blog.settings.ts 的 baseUrl 设为 ${expected}。当前没有可公开部署的目标。`,
  )
}
console.log(`Pages 地址校验通过：${address}`)
