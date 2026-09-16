import apiClient from "./client";

export async function registerUser({ email, password, full_name }) {
  const response = await apiClient.post("/auth/register", {
    email,
    password,
    full_name,
  });
  return response.data;
}

export async function loginUser({ email, password }) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });
  return response.data;
}