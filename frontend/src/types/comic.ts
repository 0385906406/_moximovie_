export interface ComicCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ComicChapterData {
  filename: string;
  chapter_name: string;
  chapter_title?: string;
  chapter_api_data?: string;
}

export interface ComicChapterServer {
  server_name: string;
  server_data: ComicChapterData[];
}

export interface Comic {
  _id: string;
  slug: string;
  name: string;
  origin_name: string[];
  status: "ongoing" | "completed" | string;
  sub_docquyen: boolean;
  thumb_url: string;
  thumb_full: string;
  updatedAt: string;
  category: ComicCategory[];
  author: string[];
  content?: string;
  chapters: ComicChapterServer[];  // Lưu nguyên mảng server từ API
}