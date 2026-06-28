export interface PlaylistMovie {
    userId: string;      // ID user
    movieId: string;     // ID phim
    episodeId: string;   // ID tập
    serverName: string;  // tên server (nếu có nhiều server)
    watchedTime: number; // thời gian đã xem trong tập (số giây)
    watchedAt: Date;     // thời điểm xem lần cuối
    watched: boolean;     // đánh dấu đã xem hay chưa
}