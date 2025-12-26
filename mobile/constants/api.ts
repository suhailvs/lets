import axios from "axios";
// import { useStorageState } from "@/login_extras/useStorageState";

import { router } from "expo-router";

const api = axios.create({
  // baseURL: process.env.REACT_APP_BASE_URL || "http://172.17.3.167:8000/api/v1",
  baseURL: "https://suhailvs.pythonanywhere.com/api/v1",
});

// if token has been deleted from the table, then user need to signout
export const setupAxiosInterceptors = (signOut:any) => {
  api.interceptors.response.use(
    (response) => response, // Pass successful responses
    async (error) => {
      if (error.response?.status === 401) {
        console.log("Unauthorized! Logging out...");
        signOut(); // Call logout function from context
      }
      //  else if (error.response?.status === 429) {
      //   // request throttled
      //   console.error('Too Many Requests:',error.response?.data?.detail);
      // }
      return Promise.reject(error);
    }
  );
};

export default api;