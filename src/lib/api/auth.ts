import { apiClient } from "@/lib/api/client";
import type { StaffUser, StudentAccount } from "@/lib/api/types";

/** `remember` allonge la durée de vie du jeton (une journée sinon, un mois) : voir aussi lib/auth/store. */
export async function staffLogin(email: string, password: string, remember = false) {
  const { data } = await apiClient.post<{ data: { token: string; user: StaffUser } }>("/login", {
    email,
    password,
    remember,
    device_name: "web-admin",
  });

  return data.data;
}

export async function parentLogin(matricule: string, password: string, remember = false) {
  const { data } = await apiClient.post<{ data: { token: string; student: StudentAccount } }>("/parent/login", {
    matricule,
    password,
    remember,
    device_name: "web-portail",
  });

  return data.data;
}

/** Demande un lien de réinitialisation. La réponse est la même que le compte existe ou non. */
export async function requestStaffPasswordReset(email: string) {
  const { data } = await apiClient.post<{ message: string }>("/forgot-password", { email });
  return data.message;
}

/** Idem pour le portail parent : le lien part chez le tuteur de l'élève. */
export async function requestParentPasswordReset(matricule: string) {
  const { data } = await apiClient.post<{ message: string }>("/parent/forgot-password", { matricule });
  return data.message;
}

export interface StaffPasswordResetPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ParentPasswordResetPayload {
  matricule: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export async function resetStaffPassword(payload: StaffPasswordResetPayload) {
  await apiClient.post("/reset-password", payload);
}

export async function resetParentPassword(payload: ParentPasswordResetPayload) {
  await apiClient.post("/parent/reset-password", payload);
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
