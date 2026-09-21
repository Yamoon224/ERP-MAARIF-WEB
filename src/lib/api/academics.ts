import { apiClient } from "@/lib/api/client";
import type {
  AcademicYear,
  PaginatedResponse,
  SchoolClass,
  Subject,
  TeachingAssignment,
  Term,
  TermOverview,
  TermStudentRow,
  TermSubject,
} from "@/lib/api/types";

// --- Classes -----------------------------------------------------------

export async function listSchoolClasses(params: { search?: string; academic_year?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<SchoolClass>>("/classes", { params });
  return data;
}

export async function createSchoolClass(payload: { name: string; level: string; academic_year: string; main_teacher_id?: string | null }) {
  const { data } = await apiClient.post<{ data: SchoolClass }>("/classes", payload);
  return data.data;
}

export async function updateSchoolClass(id: string, payload: Partial<{ name: string; level: string; academic_year: string; main_teacher_id: string | null }>) {
  const { data } = await apiClient.put<{ data: SchoolClass }>(`/classes/${id}`, payload);
  return data.data;
}

export async function deleteSchoolClass(id: string) {
  await apiClient.delete(`/classes/${id}`);
}

export async function getSchoolClass(id: string) {
  const { data } = await apiClient.get<{ data: SchoolClass }>(`/classes/${id}`);
  return data.data;
}

// --- Affectations des enseignants ------------------------------------------

/** Matières d'une classe qui ont un enseignant. */
export async function listClassAssignments(classId: string) {
  const { data } = await apiClient.get<{ data: TeachingAssignment[] }>(`/classes/${classId}/subjects`);
  return data.data;
}

/** Donne la matière de la classe à cet enseignant (remplace l'éventuel enseignant actuel). */
export async function assignTeacher(classId: string, subjectId: string, teacherId: string) {
  const { data } = await apiClient.put<{ data: TeachingAssignment }>(`/classes/${classId}/subjects/${subjectId}`, {
    teacher_id: teacherId,
  });
  return data.data;
}

export async function unassignSubject(classId: string, subjectId: string) {
  await apiClient.delete(`/classes/${classId}/subjects/${subjectId}`);
}

/** Ce que l'utilisateur connecté enseigne : une ligne par couple classe + matière. */
export async function listMyAssignments() {
  const { data } = await apiClient.get<{ data: TeachingAssignment[] }>("/me/assignments");
  return data.data;
}

// --- Matieres ------------------------------------------------------------

export async function listSubjects(params: { search?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Subject>>("/subjects", { params });
  return data;
}

export async function createSubject(payload: { name: string; code: string; coefficient: number }) {
  const { data } = await apiClient.post<{ data: Subject }>("/subjects", payload);
  return data.data;
}

export async function updateSubject(id: string, payload: Partial<{ name: string; code: string; coefficient: number }>) {
  const { data } = await apiClient.put<{ data: Subject }>(`/subjects/${id}`, payload);
  return data.data;
}

export async function deleteSubject(id: string) {
  await apiClient.delete(`/subjects/${id}`);
}

// --- Trimestres ----------------------------------------------------------

export async function listAllTerms() {
  const { data } = await apiClient.get<{ data: Term[] }>("/terms");
  return data.data;
}

export async function listTermsPaginated(params: { academic_year?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Term>>("/terms/paginated", { params });
  return data;
}

export async function createTerm(payload: { name: string; academic_year: string; starts_at: string; ends_at: string; is_current?: boolean }) {
  const { data } = await apiClient.post<{ data: Term }>("/terms", payload);
  return data.data;
}

export async function updateTerm(id: string, payload: Partial<{ name: string; academic_year: string; starts_at: string; ends_at: string; is_current: boolean }>) {
  const { data } = await apiClient.put<{ data: Term }>(`/terms/${id}`, payload);
  return data.data;
}

export async function deleteTerm(id: string) {
  await apiClient.delete(`/terms/${id}`);
}

// --- Années scolaires et détail d'un trimestre ---------------------------------

/** Années scolaires connues, la plus récente en premier, avec leurs trimestres. */
export async function listAcademicYears() {
  const { data } = await apiClient.get<{ data: AcademicYear[] }>("/academic-years");
  return data.data;
}

/** Idem pour le portail parent, qui ne peut pas lire les routes du personnel. */
export async function listMyAcademicYears() {
  const { data } = await apiClient.get<{ data: AcademicYear[] }>("/parent/academic-years");
  return data.data;
}

export async function getTermOverview(termId: string) {
  const { data } = await apiClient.get<{ data: TermOverview }>(`/terms/${termId}/overview`);
  return data.data;
}

export async function listTermSubjects(termId: string) {
  const { data } = await apiClient.get<{ data: TermSubject[] }>(`/terms/${termId}/subjects`);
  return data.data;
}

export async function listTermStudents(termId: string, params: { search?: string; school_class_id?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<TermStudentRow>>(`/terms/${termId}/students`, { params });
  return data;
}

/** Classes d'une année scolaire, avec leur effectif. */
export async function listClassesOfYear(academicYear: string) {
  const { data } = await apiClient.get<PaginatedResponse<SchoolClass>>("/classes", {
    params: { academic_year: academicYear, per_page: 100 },
  });
  return data.data;
}

export async function getTerm(termId: string) {
  const { data } = await apiClient.get<{ data: Term }>(`/terms/${termId}`);
  return data.data;
}
