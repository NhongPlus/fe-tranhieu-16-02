import API from "./axios";

export const getTelegramStatus = () => API.get("/telegram/status");
export const unlinkTelegram = () => API.delete("/telegram/unlink");
