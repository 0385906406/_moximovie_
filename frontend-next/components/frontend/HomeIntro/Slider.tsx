const Slider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {

    return (
        <div
            className="
                relative w-full
                min-h-screen
                overflow-hidden
                text-white
                select-none
            "
        >
            {/* Background */}
            <img
                src="/home_background.webp"
                alt="MoxiMovie Background"
                className="
                    absolute inset-0 w-full h-full
                    object-cover object-center
                    opacity-100 transition-opacity duration-700
                    -z-20
                "
            />

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

export default Slider;