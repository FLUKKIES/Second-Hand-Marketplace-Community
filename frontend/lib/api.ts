/*
ตัวกลางสำหรับจัดการการเชื่อมต่อ API โดยใชช้ Axios
*/

import axios, {
    InternalAxiosRequestConfig,
    AxiosResponse,
    AxiosInstance,
    AxiosError,
    AxiosRequestConfig
} from "axios";

interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
    status?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const IS_SERVER = typeof window === "undefined";

// Configuration
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
    withCredentials: true, // Send cookies with requests
});

// Interceptors for response handling
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        // Handle 401 Unauthorized (Token Expired)
        if (error.response?.status === 401) {
            // Don't redirect if checking auth status
            if (error.config?.url?.includes("/users/me") || error.config?.url?.includes("auth/profile")) {
                return Promise.reject(error);
            }

            if (!IS_SERVER) {
                // Prevent infinite loop if already on login page
                if (window.location.pathname !== "/login" && !window.location.pathname.startsWith("/login?")) {
                    // Redirect to login
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

// Error Parser Helper (ฟังก์ชันช่วยแกะ Error Message)
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        // 1. Handle NestJS Custom Validation Error ({ errors: [{ field, message }] })
        if (data && data.errors && Array.isArray(data.errors)) {
            // เอา message ทั้งหมดมาต่อกัน หรือจะเลือกแสดงแค่อันแรกก็ได้
            return data.errors.map((err: any) => err.message).join("\n");
        }

        // 2. Handle Standard NestJS Error (e.g. 401 Unauthorized, 404 Not Found)
        if (data && data.message) {
            // บางที Nest ส่ง message เป็น array (default behavior) หรือ string
            if (Array.isArray(data.message)) {
                return data.message.join("\n");
            }
            return data.message;
        }

        // 3. Fallback
        return error.response?.statusText || error.message;
    }
    return String(error);
};

// Export API Methods
export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.post<T>(url, data, config).then((res) => res.data),

    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.put<T>(url, data, config).then((res) => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.delete<T>(url, config).then((res) => res.data),

    patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.patch<T>(url, data, config).then((res) => res.data),

    // Specialized Methods
    uploadImage: async (
        file: File,
        type: 'post' | 'product' | 'avatar' | 'slip' | 'category' | 'group/profile' | 'group/cover'
    ): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        // ใช้ post<T> ที่เราสร้างไว้ข้างบนเพื่อให้ type return ตรงกัน
        const response = await axiosInstance.post<{ url: string }>(
            `/upload/${type}`,
            formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data.url;;
    },

    getImageUrl: (path: string | null | undefined): string => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("blob:")) return path;

        // Clean slash logic: ตัด / ออกจากท้าย baseURL และหน้า path เพื่อกันเบิ้ล //
        const cleanBase = API_URL.replace(/\/+$/, "");
        const cleanPath = path.replace(/^\/+/, "");

        return `${cleanBase}/${cleanPath}`;
    }
};
