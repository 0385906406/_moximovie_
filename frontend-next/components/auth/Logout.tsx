"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "../ui/button";
// import { useRouter } from "next/navigation";

const Logout = () => {
    const {signOut} = useAuthStore();
    // const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            // router.push("/signin");
        } catch (error) {
            console.error(error);
        };
    };

    return (
        <Button onClick={handleLogout}>Logout</Button>
    );
};

export default Logout;