// 🪶 types/manga.d.ts
export interface MangaChapter {
  id: number
  order: number
  number: string
  name: string
  views_count: number
  comments_count: number
  status: "processed" | "pending" | "error"
  previous_chapter_id: number | null
  previous_chapter_number: string | null
  previous_chapter_name: string | null
  next_chapter_id: number | null
  next_chapter_number: string | null
  next_chapter_name: string | null
  created_at: string // ISO timestamp
  updated_at: string

  pages: MangaPage[]
}

export interface MangaPage {
  id: number
  order: number
  width: number
  height: number
  status: "processed" | "pending" | "error"
  image_url: string
  image_path: string
  image_url_size: number
  drm_data: string // base64-encoded DRM data
}
