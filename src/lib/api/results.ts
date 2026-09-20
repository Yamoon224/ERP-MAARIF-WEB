import { apiClient } from "@/lib/api/client";
import type {
  ClassResults,
  PromotionDecisionValue,
  PromotionSummary,
  ResultPeriodKind,
  SavedDecision,
  StudentResults,
} from "@/lib/api/types";

export interface ClassResultsParams {
  school_class_id: string;
  period: ResultPeriodKind;
  /** Requis pour `term`. */
  term_id?: string;
  /** Requis pour `semester` : 1 = trimestres 1 et 2, 2 = trimestres 2 et 3. */
  semester?: 1 | 2;
}

export async function getClassResults(params: ClassResultsParams) {
  const { data } = await apiClient.get<{ data: ClassResults }>("/results", { params });
  return data.data;
}

export async function getStudentResults(studentId: string, academicYear?: string) {
  const { data } = await apiClient.get<{ data: StudentResults }>(`/students/${studentId}/results`, {
    params: { academic_year: academicYear },
  });
  return data.data;
}

/** Résultats de son enfant, pour le portail parent. */
export async function getMyResults(academicYear?: string) {
  const { data } = await apiClient.get<{ data: StudentResults }>("/parent/results", {
    params: { academic_year: academicYear },
  });
  return data.data;
}

export async function saveDecision(enrollmentId: string, decision: PromotionDecisionValue, note?: string) {
  const { data } = await apiClient.put<{ data: SavedDecision & { enrollment_id: string } }>(`/enrollments/${enrollmentId}/decision`, {
    decision,
    note: note || null,
  });
  return data.data;
}

/**
 * Réinscrit la classe pour l'année suivante d'après les décisions enregistrées :
 * admis dans `admittedClassId`, redoublants dans `repeatClassId` (facultatif).
 */
export async function promoteClass(schoolClassId: string, payload: { admitted_class_id: string; repeat_class_id?: string | null }) {
  const { data } = await apiClient.post<{ data: PromotionSummary }>(`/classes/${schoolClassId}/promotions`, {
    admitted_class_id: payload.admitted_class_id,
    repeat_class_id: payload.repeat_class_id || null,
  });
  return data.data;
}

/** Enregistre d'un coup les décisions suggérées de la classe ; renvoie leur nombre. */
export async function validateClassDecisions(schoolClassId: string) {
  const { data } = await apiClient.post<{ data: { validated: number } }>(`/classes/${schoolClassId}/decisions/validate`);
  return data.data.validated;
}
