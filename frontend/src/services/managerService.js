import api from "./api";

export async function getManagerTeam() {
  const response = await api.get("/manager/team");
  return response.data;
}

export async function getManagerQueries() {
  const response = await api.get("/manager/queries");
  return response.data;
}