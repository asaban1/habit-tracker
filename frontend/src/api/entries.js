import apiClient from "./client";

export async function createEntry(entryData) {
  const response = await apiClient.post("/entries/", entryData);
  return response.data;
}

export async function getEntries() {
  const response = await apiClient.get("/entries/");
  return response.data;
}

export async function updateEntry(entryId, entryData) {
  const response = await apiClient.put(`/entries/${entryId}`, entryData);
  return response.data;
}

export async function deleteEntry(entryId) {
  await apiClient.delete(`/entries/${entryId}`);
}