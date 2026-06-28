"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
    skipRedirect?: boolean;
    children?: React.ReactNode;
}

const ProtectedRoute = ({ skipRedirect = false, children }: ProtectedRouteProps) => {
    const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
    const [starting, setStarting] = useState(true);
    const router = useRouter();

    const init = async () => {
        if (!accessToken) {
            await refresh();
        }

        if (accessToken && !user) {
            await fetchMe();
        }

        setStarting(false);
    };

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (!starting && !loading && !accessToken && !skipRedirect) {
            router.replace("/phimhay");
        }
    }, [starting, loading, accessToken, skipRedirect]);

    if (starting || loading) {
        return <></>;
    }

    if (!accessToken && !skipRedirect) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;