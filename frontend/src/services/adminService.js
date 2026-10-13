
import api from "./api";

export async function getAdminUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

export async function updateAdminUserStatus(userId, isActive) {
  const response = await api.patch(`/admin/users/${userId}/status`, {
    is_active: isActive,
  });
  return response.data;
}

export async function updateAdminUserRole(userId, role) {
  const response = await api.patch(`/admin/users/${userId}/role`, {
    role,
  });
  return response.data;
}

export async function updateAdminUserManager(userId, managerId) {
  const response = await api.patch(`/admin/users/${userId}/manager`, {
    manager_id: managerId,
  });
  return response.data;
}
