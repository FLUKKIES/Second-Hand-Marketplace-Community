import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Create a configured axios instance
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    headers: {
        "Content-Type": "application/json",
    },
});

// Optional: Add interceptors for request/response handling (e.g., auth tokens)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Example: Attach token if available
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Handle global errors (e.g. 401 logout)
        return Promise.reject(error);
    }
);
