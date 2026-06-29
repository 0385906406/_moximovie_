"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThongTinPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/phimhay"); }, [router]);
    return null;
}
