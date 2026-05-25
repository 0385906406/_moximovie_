import { X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface PlaylistPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

const playlistSchema = z.object({
    name: z.string().min(6, "Tên danh sách phát phải có ít nhất 6 ký tự"),
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

export default function CreatePlaylistPopup({ isOpen, onClose, onCreate }: PlaylistPopupProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<PlaylistFormValues>({
        resolver: zodResolver(playlistSchema),
    });

    // Reset form khi đóng popup
    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen, reset]);

    // ESC key để đóng popup
    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    const handleCreate = (data: PlaylistFormValues) => {
        onCreate(data.name);
        onClose(); // tự đóng sau khi tạo
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={onClose} // click ngoài popup đóng
        >
            <div
                className="bg-gray-800 rounded-lg p-6 w-80 relative"
                onClick={(e) => e.stopPropagation()} // ngăn click bên trong đóng popup
            >
                {/* Nút đóng */}
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-semibold mb-4 text-white">Tạo danh sách phát mới</h2>

                <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-3">
                    <Input
                        type="text"
                        placeholder="Nhập tên danh sách phát..."
                        className="text-white"
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name.message}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        <Plus className="w-4 h-4" />
                        {isSubmitting ? "Đang tạo..." : "Tạo"}
                    </Button>
                </form>
            </div>
        </div>
    );
}