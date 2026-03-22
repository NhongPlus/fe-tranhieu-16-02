import axios from "axios";

const instance = axios.create({
  // Để baseURL không có dấu xuyệt ở cuối
  baseURL: "https://nckk.onrender.com/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Gắn token ưu tiên access_token nếu có trong user, fallback token cũ
  const authToken = user.access_token || token;
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  // Gắn student-id vào header (quan trọng cho logic của bạn)
  if (user.student_id) {
    config.headers["student-id"] = user.student_id;
  }

  return config;
});

export default instance;