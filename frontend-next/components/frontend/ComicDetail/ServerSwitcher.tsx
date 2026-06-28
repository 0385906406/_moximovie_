import React from "react";
import type { Server } from "@/types/server";

interface ServerSwitcherProps {
    servers: Server[];
    currentIndex: number;
    onChange: (index: number) => void;
}

/**
 * ServerSwitcher: render list server (Vietsub, Thuyết minh, ...) dạng button
 */
const ServerSwitcher: React.FC<ServerSwitcherProps> = ({
    servers,
    currentIndex,
    onChange,
}) => {
    if (!servers.length) return null;

    return (
        <div className="mb-4 flex flex-wrap gap-2">
            {servers.map((s, idx) => {
                const active = idx === currentIndex;
                return (
                    <button
                        key={idx}
                        onClick={() => onChange(idx)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ring-1 ring-white/10 ${active
                                ? "bg-yellow-400 text-black"
                                : "bg-white/5 text-gray-200 hover:bg-white/10"
                            }`}
                    >
                        {s.server_name}
                    </button>
                );
            })}
        </div>
    );
};

export default ServerSwitcher;