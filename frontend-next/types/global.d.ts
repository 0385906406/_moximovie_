export {};

declare global {
    interface Window {
        __monetagLoaded?: boolean;
        __monetagLastLoad?: number;
    }
}