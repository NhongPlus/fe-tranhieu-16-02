import API from "./axios";

// Hàm lấy danh sách lịch học (Dấu / cuối cùng theo Swagger của bạn)
export const getEvents = () => {
  return API.get("/events/");
};

// Hàm tạo lịch học hàng loạt
export const createEvents = (data: { events: any[] }) => {
  return API.post("/events", data);
};