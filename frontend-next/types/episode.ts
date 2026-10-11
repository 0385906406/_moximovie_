export interface Episode {
    id?: string;
    /* VodPhim: id tập dùng cho trình phát nhúng (playembed.vip/player/{episode_id}) */
    episode_id?: string;
    filename?: string;
    name?: string;
    link_m3u8?: string;
    link_embed?: string;
    slug: string;
}