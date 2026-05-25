import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
    skipRedirect?: boolean; // nếu true → không redirect về /signin
}

const ProtectedRoute = ({ skipRedirect = false }: ProtectedRouteProps) => {
    const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
    const [starting, setStarting] = useState(true);

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

    if (starting || loading) {
        return (<></>);
    }

    if (!accessToken && !skipRedirect) {
        return <Navigate to="/phimhay" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;