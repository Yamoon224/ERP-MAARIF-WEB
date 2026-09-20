export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  message: string;
  error_code: string;
  errors?: Record<string, string[]>;
  context?: Record<string, unknown>;
}

export type StaffRole = "admin" | "teacher";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: "staff";
  roles: StaffRole[];
  permissions: string[];
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string;
}

export interface StudentAccount {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  type: "parent";
  school_class?: { id: string; name: string } | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: string;
  academic_year: string;
  students_count?: number;
  main_teacher?: { id: string; name: string } | null;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
}

export interface Term {
  id: string;
  name: string;
  academic_year: string;
  starts_at: string;
  ends_at: string;
  is_current: boolean;
}

export interface Student {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  birth_date: string | null;
  school_class: { id: string; name: string; level: string } | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  address: string | null;
  is_active: boolean;
  created_at?: string;
}

export type GradeType = "devoir" | "composition";

export interface Grade {
  id: string;
  student: { id: string; name: string; matricule: string };
  subject: { id: string; name: string; code: string };
  term: { id: string; name: string };
  type: GradeType;
  label: string | null;
  value: number;
  max_value: number;
  normalized_on_20: number;
  recorded_at: string;
  comment: string | null;
}

export type AttendanceStatus = "present" | "absent" | "retard";

export interface AttendanceRecord {
  id: string;
  student: { id: string; name: string; matricule: string };
  date: string;
  status: AttendanceStatus;
  justified: boolean;
  reason: string | null;
}

export type SummonStatus = "pending" | "done" | "cancelled";

export interface Summon {
  id: string;
  student: { id: string; name: string; matricule: string };
  reason: string;
  scheduled_at: string;
  location: string | null;
  status: SummonStatus;
  notified_at: string | null;
}

export type SanctionType = "avertissement" | "exclusion_temporaire" | "renvoi_definitif";

export interface Sanction {
  id: string;
  student: { id: string; name: string; matricule: string };
  type: SanctionType;
  type_label: string;
  reason: string;
  start_date: string;
  end_date: string | null;
  notified_at: string | null;
}

export interface Bulletin {
  student: { id: string; name: string; matricule: string };
  term_id: string;
  subjects: Array<{ subject: string; code: string; coefficient: number; average: number; grades_count: number }>;
  overall_average: number | null;
}

export interface NotificationLog {
  id: string;
  student: { id: string; name: string };
  channel: "email" | "sms";
  type: "convocation" | "sanction" | "bulletin";
  recipient: string;
  subject: string | null;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
  created_at: string;
}
