export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Академия";
/** Max size of one uploaded file (homework photos/videos, voice notes). */
export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 150);
export const STORAGE_MODE = process.env.NEXT_PUBLIC_STORAGE === "local" ? "local" : "blob";
