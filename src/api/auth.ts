import axios from "axios";

const API = axios.create({
  baseURL: "https://nckk.onrender.com/api",
});

export const loginUser = (data: any) => {
  return API.post("/auth/login", data);
};

export const registerUser = (data: any) => {
  return API.post("/auth/regiter", data);
};