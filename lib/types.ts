export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string | null;
  author?: string | null;
  pubDatetime: string;
  modifiedDatetime?: string | null;
  views: number;
}
