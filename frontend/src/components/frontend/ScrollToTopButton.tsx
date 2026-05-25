import { useEffect, useRef, useState } from "react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);
    const [show, setShow] = useState(false);
    const hideTimeout = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 200) {
                setShow(true);
                setTimeout(() => setVisible(true), 10); // trigger transition "in"
            } else {
                setVisible(false);
                if (hideTimeout.current) clearTimeout(hideTimeout.current);
                hideTimeout.current = window.setTimeout(() => setShow(false), 300); // match duration
            }
        };

        window.addEventListener("scroll", handleScroll);
        // initial visibility check
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Custom effect: fade + slide up/down
    // Show the element when visible, fade and slide with smoothing when shown/hidden
    return show ? (
        <div
            onClick={scrollToTop}
            title="Lên đầu trang"
            style={{
                transition: "opacity 0.33s cubic-bezier(.48,1.4,.48,1), transform 0.33s cubic-bezier(.48,1.4,.48,1)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.75)",
                pointerEvents: visible ? "auto" : "none",
            }}
            className={`
                fixed bottom-4 right-4 w-12 h-12 bg-white text-black 
                flex items-center justify-center cursor-pointer z-[9999] rounded-[9.6px] shadow-lg
            `}
        >
            <i className="fa-solid fa-arrow-up text-[14px]"></i>
        </div>
    ) : null;
}