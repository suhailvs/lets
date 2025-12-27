import axios from "axios";
const api = axios.create({
  // baseURL: process.env.REACT_APP_BASE_URL || "http://172.17.3.167:8000/api/v1",
  baseURL: "https://suhailvs.pythonanywhere.com/api/v1",
});
export default api;