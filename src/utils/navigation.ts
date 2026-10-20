export function isNavLinkActive(href: string, pathname: string): boolean {
  const target = href.replace(/\/+$/, '') || '/'
  const current = pathname.replace(/\/+$/, '') || '/'

  if (target === '/') {
    return current === '/' || /^\/(?:posts(?:\/|$)|\d+$)/.test(current)
  }

  return current === target || current.startsWith(`${target}/`)
}
