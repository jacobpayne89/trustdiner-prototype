export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    success?: boolean;
}
export interface SearchResult {
    place_id: string;
    name: string;
    address: string;
    rating: number;
    user_ratings_total: number;
    price_level: number;
    position: {
        lat: number;
        lng: number;
    };
    types: string[];
    source: 'database' | 'google' | 'cache';
    inDatabase: boolean;
    databaseId?: number;
    addable: boolean;
    localImageUrl?: string;
}
export interface DashboardData {
    usage: {
        today: {
            date: string;
            calls: any[];
            totals: {
                TEXT_SEARCH: number;
                PLACE_DETAILS: number;
                PLACE_PHOTOS: number;
                TOTAL: number;
            };
            costs: {
                TEXT_SEARCH: number;
                PLACE_DETAILS: number;
                PLACE_PHOTOS: number;
                TOTAL: number;
            };
        };
        thisMonth: {
            totalCalls: number;
            totalCost: number;
            daysActive: number;
        };
        allTime: {
            totalCalls: number;
            totalCost: number;
            placesAdded: number;
        };
    };
    quota: {
        TOTAL_REQUESTS: number;
        TEXT_SEARCH: number;
        PLACE_DETAILS: number;
        PLACE_PHOTOS: number;
    };
    limits: {
        TOTAL_REQUESTS: number;
        TEXT_SEARCH: number;
        PLACE_DETAILS: number;
        PLACE_PHOTOS: number;
    };
    timestamp: number;
}
//# sourceMappingURL=api.d.ts.map