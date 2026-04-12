const API_URL = import.meta.env.VITE_API_URL

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  data?: unknown,
  customHeaders: HeadersInit = {}
): Promise<T> {

  const isFormData =
    typeof FormData !== "undefined" &&
    data &&
    (data as any).constructor?.name === "FormData";

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...customHeaders,
    },
    credentials: "include",
    body: data
      ? isFormData
        ? data
        : JSON.stringify(data)
      : undefined,
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}