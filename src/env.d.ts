export { };

declare global {
    interface PlausibleOptions {
        hashBasedRouting?: boolean;
        trackLocalhost?: boolean;
        domain?: string;
        apiHost?: string;
    }

    interface Window {
        plausible: {
            (...args: unknown[]): void;
            q?: unknown[][];
            o?: PlausibleOptions;
            init: (options?: PlausibleOptions) => void;
        };
    }
}