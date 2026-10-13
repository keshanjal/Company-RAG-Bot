import api from "./api";

export async function askQuestion(data) {
  const response = await api.post(
    "/chat/ask",
    data,
  );

  return response.data;
}