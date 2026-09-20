import { apiClient } from "@/lib/api/client";
import type { StaffUser, StudentAccount } from "@/lib/api/types";

export async function staffLogin(email: string, password: string) {
  const { data } = await apiClient.post<{ data: { token: string; user: StaffUser } }>("/login", {
    email,
    password,
    device_name: "web-admin",
  });

  return data.data;
}

export async function parentLogin(matricule: string, password: string) {
  const { data } = await apiClient.post<{ data: { token: string; student: StudentAccount } }>("/parent/login", {
    matricule,
    password,
    device_name: "web-portail",
  });

  return data.data;
}

export async function staffLogout() {
  await apiClient.post("/logout");
}

export async function parentLogout() {
  await apiClient.post("/parent/logout");
}

export interface ProfilePayload {
  name: string;
  email: string;
  phone?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function updateStaffProfile(payload: ProfilePayload) {
  const { data } = await apiClient.put<{ data: StaffUser }>("/me", payload);
  return data.data;
}

export async function changeStaffPassword(payload: ChangePasswordPayload) {
  await apiClient.put("/me/password", payload);
}

export async function changeParentPassword(payload: ChangePasswordPayload) {
  await apiClient.put("/parent/me/password", payload);
}
