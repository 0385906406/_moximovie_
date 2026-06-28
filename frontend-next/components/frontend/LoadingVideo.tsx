import React from "react";

const LoadingVideo: React.FC<{ visible: boolean }> = ({ visible }) => {
    return (
        <div
            className={`
                fixed inset-0 z-[9999]
                bg-black
                transition-opacity duration-700
                ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            `}
        >
            <video
                className="
                    absolute inset-0
                    w-full
                    h-[100svh] h-screen
                    object-cover
                "
                src="/loading.mp4"
                autoPlay
                muted
                loop
                playsInline
                webkit-playsinline="true"
                preload="auto"
            />
        </div>
    );
};

export default LoadingVideo;