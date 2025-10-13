// API のレスポンス内の各マンガ項目を表すインターフェースです。
// (これは JSON のキーに厳密に合わせてあります。)
export interface MangaItem {
  id: number
  name: string
  cover_url: string
  cover_mobile_url: string
  newest_chapter_number: string // e.g. "30.5" or "13 "
  newest_chapter_id: number
  newest_chapter_created_at: string // ISO 8601 timestamp as string (e.g. "2025-10-10T16:29:06.857+07:00")
}

// ページネーション情報
export interface MetaData {
  total_count: number
  total_pages: number
  current_page: number
  per_page: number
}

// ルートのレスポンス型
export interface MangaListResponse {
  data: MangaItem[]
  _metadata: MetaData
}
