import { useCallback, useEffect, useState } from "react";

const KEY = (slug: string) => `moxi_watched_${slug}`;

function load(slug: string): Set<string> {
    try {
        const raw = localStorage.getItem(KEY(slug));
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch {
        return new Set();
    }
}

function save(slug: string, set: Set<string>) {
    try {
        localStorage.setItem(KEY(slug), JSON.stringify([...set]));
    } catch { /* storage full — silent fail */ }
}

export function useLocalWatched(movieSlug: string | undefined) {
    const [watched, setWatched] = useState<Set<string>>(() =>
        movieSlug ? load(movieSlug) : new Set()
    );

    useEffect(() => {
        setWatched(movieSlug ? load(movieSlug) : new Set());
    }, [movieSlug]);

    const markWatched = useCallback((episodeSlug: string) => {
        if (!movieSlug) return;
        setWatched((prev) => {
            if (prev.has(episodeSlug)) return prev;
            const next = new Set(prev);
            next.add(episodeSlug);
            save(movieSlug, next);
            return next;
        });
    }, [movieSlug]);

    const isWatched = useCallback(
        (episodeSlug: string) => watched.has(episodeSlug),
        [watched]
    );

    return { markWatched, isWatched };
}
