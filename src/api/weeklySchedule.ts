import API from "./axios";

// Lấy lịch học theo tuần (theo API mới)
export const getWeeklySchedule = (week_offset: number = 0) => {
  return API.get("/events/schedule/weekly", { params: { week_offset } });
};
