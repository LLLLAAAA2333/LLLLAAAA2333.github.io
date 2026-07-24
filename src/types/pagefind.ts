export interface PagefindResultData {
  url: string
  excerpt: string
  plain_excerpt: string
  meta: {
    title?: string
    date?: string
    category?: string
    tags?: string
  }
}

export interface PagefindResultReference {
  id: string
  data: () => Promise<PagefindResultData>
}

export interface PagefindSearchResponse {
  results: PagefindResultReference[]
}

export interface PagefindApi {
  search: (query: string) => Promise<PagefindSearchResponse>
}
