import API from "./axios";

// Hàm lấy danh sách lịch học (Dấu / cuối cùng theo Swagger của bạn)
// student-id sẽ được gửi qua header bởi axios interceptor trong src/api/axios.ts
export const getEvents = (params?: Record<string, string | number | boolean | undefined>) => {
  if (params && Object.keys(params).length > 0) {
    return API.get("/events", { params });
  }
  return API.get("/events");
};

// Hàm tạo lịch học hàng loạt
export const createEvents = (data: { events: any[] }) => {
  return API.post("/events", data);
};