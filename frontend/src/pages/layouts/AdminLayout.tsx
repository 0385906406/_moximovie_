// layouts/AdminLayout.tsx
import { Outlet } from "react-router";

export default function AdminLayout() {
    return (
        <div className="admin-layout flex">
            <aside>Sidebar admin</aside>
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}