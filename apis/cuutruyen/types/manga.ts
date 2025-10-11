// 🪶 types/manga.ts

export interface Manga {
  id: number;
  name: string;
  cover_url: string;
  cover_mobile_url?: string;
  panorama_url?: string;
  panorama_mobile_url?: string;
  panorama_dominant_color?: string;
  panorama_dominant_color_2?: string;
  newest_chapter_number: string;
  newest_chapter_id: number;
  newest_chapter_created_at: string; // ISO timestamp
  author: MangaAuthor;
  description: string;
  full_description: string; // HTML string
  official_url: string;
  is_region_limited: boolean;
  is_ads: boolean;
  chapters_count: number;
  views_count: number;
  is_nsfw: boolean;

  tags: MangaTag[];
  team: MangaTeam;
  is_following: boolean;
  titles: MangaTitle[];

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface MangaAuthor {
  name: string;
}

export interface MangaTag {
  name: string;
  slug: string;
  tagging_count: number;
}

export interface MangaTitle {
  id: number;
  name: string;
  primary: boolean;
}

export interface MangaTeam {
  id: number;
  slug: string;
  name: string;
  description: string;
  is_ads: boolean;
  facebook_address: string;
  views_count: number;
  translations_count: number;
  created_at: string;
  updated_at: string;

  main_page_blocks?: string; // JSON-encoded HTML content
  avatar_url?: string;
}

export interface MangaChapter {
  id: number;
  order: number;
  number: string;
  name: string;
  views_count: number;
  comments_count: number;
  status: "processed" | "pending" | "error" | string;
  created_at: string;
  updated_at: string;
}