function setupBlogCategories() {
  const navigation = document.querySelector<HTMLElement>(".post-categories")
  const list = document.getElementById("home-post-list")
  const title = document.getElementById("home-list-title")
  const order = document.getElementById("home-list-order")
  if (!navigation || !list || !title || !order || navigation.dataset.ready) return
  navigation.dataset.ready = "true"
  const buttons = Array.from(navigation.querySelectorAll<HTMLButtonElement>("button[data-filter]"))
  // Preserve the server's date order so switching back never inherits chapter order.
  const cards = Array.from(list.querySelectorAll<HTMLElement>(".post-card"))
  const applyCategory = () => {
    const requested = new URLSearchParams(location.hash.slice(1)).get("category") ?? "all"
    const active = buttons.find((button) => button.dataset.filter === requested) ?? buttons[0]
    const category = active.dataset.filter!
    const chapters = active.dataset.order === "chapter"
    const ordered = [...cards]
    if (chapters) {
      ordered.sort(
        (a, b) =>
          Number(a.dataset.sequence ?? Number.MAX_SAFE_INTEGER) -
          Number(b.dataset.sequence ?? Number.MAX_SAFE_INTEGER),
      )
    }
    let count = 0
    for (const card of ordered) {
      card.hidden = category !== "all" && card.dataset.category !== category
      if (!card.hidden) count++
      list.append(card)
    }
    for (const button of buttons) button.setAttribute("aria-pressed", String(button === active))
    title.textContent = category === "all" ? "最近的记录" : active.dataset.label!
    order.textContent = `${chapters ? "按章节顺序" : "按日期倒序"} · ${count} 篇`
  }
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const hash = `#category=${button.dataset.filter}`
      if (location.hash !== hash) history.pushState(null, "", hash)
      applyCategory()
    })
  }
  window.addEventListener("hashchange", applyCategory)
  window.addEventListener("popstate", applyCategory)
  window.addCleanup(() => {
    window.removeEventListener("hashchange", applyCategory)
    window.removeEventListener("popstate", applyCategory)
  })
  navigation.hidden = false
  applyCategory()
}

document.addEventListener("nav", setupBlogCategories)
