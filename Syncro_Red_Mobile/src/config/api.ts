export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.13:8000';
export const WS_BASE_URL = (API_BASE_URL.replace('http', 'ws'));

export const GPS_UPDATE_INTERVAL_MS = 15_000;
export const GPS_BACKGROUND_TASK = 'SYNCRO_GPS_BACKGROUND';
export const SYNC_RETRY_INTERVAL_MS = 30_000;
