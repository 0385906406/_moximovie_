import type { Episode } from "./episode";

export interface Server {
    server_name?: string;
    server_data?: Episode[];
}