import api from "./api";

export async function getChatSessions() {
  const response = await api.get("/chat/sessions");

  return response.data;
}

export async function getChatSession(sessionId) {
  const response = await api.get(
    `/chat/sessions/${sessionId}`,
  );

  return response.data;
}

export async function getChatSessionMessages(
  sessionId,
) {
  const response = await api.get(
    `/chat/sessions/${sessionId}/messages`,
  );

  return response.data;
}

export async function deleteChatSession(
  sessionId,
) {
  await api.delete(
    `/chat/sessions/${sessionId}`,
  );
}