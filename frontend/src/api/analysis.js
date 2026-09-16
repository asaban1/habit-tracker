import apiClient from "./client";

export async function getZscoreAnalysis() {
  const response = await apiClient.get("/analysis/zscore");
  return response.data;
}

export async function getIsolationForestAnalysis() {
  const response = await apiClient.get("/analysis/isolation-forest");
  return response.data;
}

export async function getCombinedAnalysis() {
  const response = await apiClient.get("/analysis/combined");
  return response.data;
}

export async function getInsights() {
  const response = await apiClient.get("/analysis/insights");
  return response.data;
}