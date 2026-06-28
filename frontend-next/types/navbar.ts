// src/types/navbar.ts
import type { ReactNode } from "react";
import type { User } from "./user";

// Dữ liệu của 1 item (dùng cho array)
export interface NavbarItem {
    to: string;
    children: ReactNode;
}

// Props cho component NavbarItem (button ở navbar chính)
export interface NavbarItemProps {
    to: string;
    children: ReactNode;
    isActive?: boolean;
}

// Props cho NavbarSidebar
export interface NavbarSidebarProps {
    items: NavbarItem[];        // ✅ mảng item
    user: User | null;          // hoặc User nếu bạn chắc chắn luôn có
    open: boolean;
    onOpenChange: (open: boolean) => void;
}