// nnaFilms.ts
export type NNAFilm = {
    id: string;
    title: string;
    year: number;
    director: string;
    basedOn: string;
    poster: string;
    description: string;
};

export const mockNNAFilms: NNAFilm[] = [
    {
        id: "tt-hvtcx",
        title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
        year: 2015,
        director: "Victor Vũ",
        basedOn: "Tiểu thuyết cùng tên",
        poster: "https:\/\/phimimg.com\/upload\/vod\/20231207-1\/2880cffc772b94868f0d808ea3bae202.jpg",
        description:
            "Tôi Thấy Hoa Vàng Trên Cỏ Xanh là bộ phim chuyển thể từ quyển truyện dài cùng tên của nhà văn Nguyễn Nhật Ánh, từng tạo nên cơn sốt và đạt giải thưởng văn học ASEAN vào năm 2010. Chuyện phim là tuổi thơ nghèo khó của hai anh em Thiều và Tường ở một làng quê Việt thân thuộc và nên thơ. Là nơi đã chứng kiến những rung động đầu đời của cả hai, tình cảm gia đình, tình anh em yêu thương chân thành, cũng như những đố kỵ, ghen tuông và những nỗi đau trong veo trong quá trình trưởng thành. Dưới những khung hình tuyệt đẹp và giàu cảm xúc của đạo diễn Victor Vũ, Tôi Thấy Hoa Vàng Trên Cỏ Xanh sẽ là một “tấm vé” đưa người xem trở lại với tuổi thơ lắm ngọt ngào lẫn day dứt mà mỗi người đều đã từng trải qua."
    },
    {
        id: "mat-biec",
        title: "Mắt Biếc",
        year: 2019,
        director: "Victor Vũ",
        basedOn: "Tiểu thuyết cùng tên",
        poster: "https:\/\/phimimg.com\/upload\/vod\/20240922-1\/9d181d0abdf6531f1792bb0eb85e3042.jpg",
        description:
            "Đạo diễn Victor Vũ trở lại với một tác phẩm chuyển thể từ truyện ngắn cùng tên nổi tiếng của nhà văn Nguyễn Nhật Ánh: Mắt Biếc. Phim kể về chuyện tình đơn phương của chàng thanh niên Ngạn dành cho cô bạn từ thuở nhỏ Hà Lan."
    },
    {
        id: "cogai-homqua",
        title: "Cô Gái Đến Từ Hôm Qua",
        year: 2017,
        director: "Phan Gia Nhật Linh",
        basedOn: "Tiểu thuyết cùng tên",
        poster: "https:\/\/phimimg.com\/upload\/vod\/20231011-1\/be587c2aaacf9f9a24288b72ba776b8d.jpg",
        description:
            "“Cô gái đến từ hôm qua” đan xen giữa hai câu chuyện của quá khứ và hiện tại về cậu học trò tên Thư. Nếu lúc còn bé, Thư luôn tự hào mình là một đứa con trai thông minh, có thể dễ dàng bắt nạt và sai khiến cô bạn hàng xóm Tiểu Li thì giờ đây, khi lớn lên, Thư luôn khổ sở vì bị Việt An, cô bạn học cùng lớp mà cậu thầm thương trộm nhớ “xỏ mũi” và quay như quay dế. Thư dần nhận ra rằng “con gái càng lớn càng khôn, con trai càng lớn càng ngu”... Bộ phim lãng mạn, hài hước mang đến những cảm xúc trong trẻo về thời học sinh ngây ngô với những trò nghịch ngợm nhất quỷ nhì ma, với những yêu thương, hờn giận, hay những rung động lạ lẫm của tình yêu đầu đời."
    },
    {
        id: "ngay-xua-co-mot-chuyen-tinh",
        title: "Ngày Xưa Có Một Chuyện Tình",
        year: 2024,
        director: "Trịnh Đình Lê Minh",
        basedOn: "Tiểu thuyết cùng tên",
        poster: "https:\/\/phimimg.com\/upload\/vod\/20250901-1\/e8b2e71c237e7dbbee1c014091f44351.jpg",
        description:
            "Ngày Xưa Có Một Chuyện Tình xoay quanh câu chuyện tình bạn, tình yêu giữa hai chàng trai và một cô gái từ thuở ấu thơ cho đến khi trưởng thành, phải đối mặt với những thử thách của số phận. Trải dài trong 4 giai đoạn từ năm 1987 - 2000, ba người bạn cùng tuổi - Vinh, Miền, Phúc đã cùng yêu, cùng bỡ ngỡ bước vào đời, va vấp và vượt qua."
    }
];