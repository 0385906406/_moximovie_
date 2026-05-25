const AFFILIATE_KEY = "affiliate_click_count";

// Lấy ngày theo giờ VN
export const getTodayKey = () => {
    const now = new Date();
    const vnTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );
    return vnTime.toISOString().split("T")[0];
};

// Random số lần cho phép trong ngày (1 → 3)
const randomDailyLimit = () => {
    return Math.floor(Math.random() * 3) + 1; // 1,2,3
};

export const getAffiliateData = () => {
    const raw = localStorage.getItem(AFFILIATE_KEY);
    const today = getTodayKey();

    if (!raw) {
        const initData = {
            date: today,
            count: 0,
            max: randomDailyLimit(),
        };
        localStorage.setItem(AFFILIATE_KEY, JSON.stringify(initData));
        return initData;
    }

    try {
        const parsed = JSON.parse(raw);

        // Sang ngày mới → reset + random lại
        if (parsed.date !== today) {
            const newData = {
                date: today,
                count: 0,
                max: randomDailyLimit(),
            };
            localStorage.setItem(AFFILIATE_KEY, JSON.stringify(newData));
            return newData;
        }

        return parsed;
    } catch {
        const fallback = {
            date: today,
            count: 0,
            max: randomDailyLimit(),
        };
        localStorage.setItem(AFFILIATE_KEY, JSON.stringify(fallback));
        return fallback;
    }
};

export const increaseAffiliateCount = () => {
    const data = getAffiliateData();

    const newData = {
        ...data,
        count: data.count + 1,
    };

    localStorage.setItem(AFFILIATE_KEY, JSON.stringify(newData));
    return newData;
};

export const isAffiliateLimitReached = () => {
    const data = getAffiliateData();
    return data.count >= data.max;
};