export interface Blog {
    id: number;
    title: string;
    slug: string;
    thumbnail: string;
    description: string;
    content: string; // 👈 BẮT BUỘC
    status?: "draft" | "published";
    createdAt?: string;
    updatedAt?: string;
}