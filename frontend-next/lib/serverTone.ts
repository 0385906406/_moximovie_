/* Nhận diện loại server từ tên API trả về.
   API hiện dùng: "Vietsub", "Thuyết Minh", "Lồng Tiếng" (cũ có thêm tiền tố "#Hà Nội (...)").
   Khớp theo từ khoá, không phân biệt hoa thường/dấu cách. */
export type ServerTone = { label: string; bg: string };

const norm = (name?: string) =>
    (name ?? "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu để khớp "thuyết" với "thuyet"
        .replace(/[#()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export function serverTone(name?: string): ServerTone {
    const n = norm(name);
    if (n.includes("thuyet minh")) return { label: "Thuyết minh", bg: "bg-[#297447]" };
    if (n.includes("long tieng")) return { label: "Lồng tiếng", bg: "bg-[#1d2e79]" };
    if (n.includes("vietsub")) return { label: "Phụ đề", bg: "bg-[#565868]" };
    return { label: "Khác", bg: "bg-[#565868]" };
}
