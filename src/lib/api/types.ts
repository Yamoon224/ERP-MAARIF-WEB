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

export type StaffRole = "admin" | "teacher" | "accountant";

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
  /** Scolarité mensuelle de la classe (0 tant qu'elle n'est pas fixée). */
  monthly_fee: number;
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

/**
 * Un enseignant, une matière, une classe. Une matière n'a qu'un enseignant par
 * classe ; un enseignant en a autant qu'il enseigne de matières et de classes.
 * `teacher` est présent dans la liste d'une classe, `school_class` dans « mes affectations ».
 */
export interface TeachingAssignment {
  id: string;
  subject: Subject;
  teacher?: { id: string; name: string } | null;
  school_class?: { id: string; name: string; level: string; academic_year: string };
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
  /** `null` pour un message d'admission : le candidat n'est pas encore un élève. */
  student: { id: string; name: string } | null;
  admission?: { id: string; name: string; reference: string } | null;
  channel: "email" | "sms";
  type: "convocation" | "sanction" | "bulletin" | "admission";
  recipient: string;
  subject: string | null;
  /** Texte complet du message envoyé au tuteur. */
  body: string;
  status: "pending" | "sent" | "failed";
  /** Nombre d'envois tentés : plus de 1 après un renvoi depuis le journal. */
  attempts: number;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  by_status: Record<NotificationLog["status"], number>;
}

// --- Périodes : année scolaire, trimestre, mois --------------------------------

/** Filtres de période acceptés par les listes et indicateurs de l'API. `month` : `YYYY-MM`. */
export interface PeriodParams {
  academic_year?: string;
  term_id?: string;
  month?: string;
}

export interface AcademicYearTerm {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_current: boolean;
}

/** Une année scolaire compte trois trimestres. */
export interface AcademicYear {
  label: string;
  starts_at: string;
  ends_at: string;
  is_current: boolean;
  terms: AcademicYearTerm[];
}

// --- Inscriptions ---------------------------------------------------------------

export interface Enrollment {
  id: string;
  academic_year: string;
  enrolled_on: string;
  student?: { id: string; name: string; matricule: string };
  school_class: { id: string; name: string; level: string; monthly_fee: number } | null;
}

// --- Détail d'un trimestre ------------------------------------------------------

export interface TermOverview {
  classes: number;
  subjects: number;
  students: number;
  grades: number;
  average: number | null;
  attendance: { present: number; absent: number; late: number; unjustified_absences: number };
  /** `null` si l'utilisateur n'a pas accès à la discipline. */
  sanctions: number | null;
  summons: number | null;
}

export interface TermSubject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  classes_count: number;
  grades_count: number;
  average: number | null;
}

export interface TermStudentRow {
  enrollment_id: string;
  student: { id: string; name: string; matricule: string; is_active: boolean };
  school_class: { id: string; name: string } | null;
  average: number | null;
  absences: number;
}

// --- Présences et absences ------------------------------------------------------

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  justified_absences: number;
  unjustified_absences: number;
  top_absentees: Array<{
    student: { id: string; name: string; matricule: string };
    absences: number;
    unjustified: number;
    lates: number;
  }>;
}

export interface RollCallRow {
  student: { id: string; name: string; matricule: string };
  record: { id: string; status: AttendanceStatus; justified: boolean; reason: string | null } | null;
}

// --- Tableau de bord --------------------------------------------------------------

export interface DashboardStats {
  academic_year: string | null;
  period: { from: string; to: string } | null;
  students: number;
  classes: number;
  /** Effectif de chaque classe de l'année, par ordre alphabétique. */
  students_by_class: Array<{ id: string; name: string; count: number }>;
  grades: { count: number; average: number | null };
  attendance: { present: number; absent: number; late: number; unjustified_absences: number };
  discipline: { sanctions: number; summons: number; summons_pending: number } | null;
  accounting: {
    collected: number;
    arrears: number;
    recovery_rate: number | null;
    by_month: Array<{ month: string; total: number }>;
    by_method: Array<{ key: PaymentMethod; label: string; total: number; count: number }>;
  } | null;
  /** Dépenses valides de la période (annulées exclues) ; null sans le droit expenses.view. */
  expenses: {
    total: number;
    count: number;
    by_category: Array<{ id: string; name: string; total: number; count: number }>;
    by_month: Array<{ month: string; total: number }>;
  } | null;
}

// --- Comptabilité ---------------------------------------------------------------

export type PaymentPeriod = "monthly" | "quarterly" | "semiannual" | "annual";
export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "cheque";

export interface Payment {
  id: string;
  receipt_number: string;
  student?: { id: string; name: string; matricule: string } | null;
  enrollment?: { id: string; academic_year: string; school_class: { id: string; name: string } | null };
  period_type: PaymentPeriod;
  period_label: string;
  /** Mois réglés, au format `YYYY-MM`. */
  months: string[];
  months_count: number;
  amount: number;
  method: PaymentMethod;
  method_label: string;
  reference: string | null;
  paid_at: string;
  note: string | null;
  status: "valid" | "cancelled";
  cancelled_at: string | null;
  cancellation_reason: string | null;
  received_by?: { id: string; name: string } | null;
}

/** paid : réglé · overdue : mois terminé non réglé · due : mois en cours · upcoming : mois à venir. */
export type InstallmentStatus = "paid" | "overdue" | "due" | "upcoming";

export interface Installment {
  id: string;
  month: string;
  amount: number;
  status: InstallmentStatus;
  paid_at: string | null;
  payment: { id: string; receipt_number: string } | null;
}

export interface TuitionStatement {
  enrollment: Enrollment;
  installments: Installment[];
  totals: {
    total: number;
    paid: number;
    remaining: number;
    overdue_amount: number;
    overdue_months: number;
    months_total: number;
    months_paid: number;
  };
}

export interface PaymentPreview {
  period: PaymentPeriod;
  requested_months: number | null;
  months: string[];
  amount: number;
}

export interface AccountingSummary {
  period: { from: string; to: string } | null;
  collected: { total: number; count: number };
  by_period_type: Array<{ key: PaymentPeriod; label: string; total: number; count: number }>;
  by_method: Array<{ key: PaymentMethod; label: string; total: number; count: number }>;
  by_month: Array<{ month: string; total: number }>;
  expected: { total: number; settled: number; rate: number | null };
  arrears: { amount: number; students: number; months: number };
}

export interface ArrearsRow {
  enrollment_id: string;
  student: { id: string; name: string; matricule: string; guardian_phone: string };
  academic_year: string;
  school_class: string | null;
  months_overdue: number;
  amount: number;
  oldest_month: string;
}

// --- Dépenses et approvisionnements ---------------------------------------------

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  expenses_count: number;
}

export interface Expense {
  id: string;
  number: string;
  category?: { id: string; name: string };
  label: string;
  supplier_name: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  /** Quantité × prix unitaire, calculé par le serveur. */
  amount: number;
  method: PaymentMethod;
  method_label: string;
  invoice_reference: string | null;
  spent_at: string;
  note: string | null;
  status: "valid" | "cancelled";
  cancelled_at: string | null;
  cancellation_reason: string | null;
  recorded_by?: { id: string; name: string } | null;
}

export interface ExpenseSummary {
  period: { from: string; to: string } | null;
  total: { total: number; count: number };
  by_category: Array<{ id: string; name: string; total: number; count: number }>;
  by_method: Array<{ key: PaymentMethod; label: string; total: number; count: number }>;
  by_month: Array<{ month: string; total: number }>;
}

// --- Admissions -----------------------------------------------------------------

/** pending → under_review → accepted | waitlisted | rejected → enrolled (inscription effective). */
export type AdmissionStatus = "pending" | "under_review" | "accepted" | "waitlisted" | "rejected" | "enrolled";

export interface Admission {
  id: string;
  reference: string;
  academic_year: string;
  level: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: "M" | "F";
  birth_date: string | null;
  previous_school: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  address: string | null;
  notes: string | null;
  status: AdmissionStatus;
  status_label: string;
  submitted_on: string;
  decision_note: string | null;
  decided_at: string | null;
  /** Renseignée quand le tuteur a bien reçu la dernière décision. */
  notified_at: string | null;
  decided_by?: { id: string; name: string } | null;
  student?: { id: string; matricule: string } | null;
  enrolled_at: string | null;
}

export interface AdmissionSummary {
  total: number;
  by_status: Record<AdmissionStatus, number>;
}

/** Réponse de l'inscription : le mot de passe initial n'est lisible qu'une fois. */
export interface AdmissionEnrollment {
  application: Admission;
  student: Student;
  initial_password: string;
}

// --- Résultats (trimestre, semestre, année) -------------------------------------

export type ResultPeriodKind = "term" | "semester" | "annual";
export type PromotionDecisionValue = "admitted" | "repeat" | "excluded";

export interface ResultPeriodInfo {
  kind: ResultPeriodKind;
  /** Identifiant du trimestre, `semester-1`, `semester-2` ou `annual`. */
  key: string;
  label: string;
  academic_year: string;
  term_ids: string[];
}

export interface SuggestedDecision {
  value: PromotionDecisionValue;
  label: string;
}

export interface SavedDecision extends SuggestedDecision {
  note: string | null;
  average: number | null;
  decided_at: string;
}

export interface ClassResultRow {
  enrollment_id: string;
  student: { id: string; name: string; matricule: string; is_active: boolean };
  average: number | null;
  rank: number | null;
  mention: string | null;
  grades_count: number;
  subjects_count: number;
  /** Renseignées sur la période annuelle seulement. */
  suggested_decision: SuggestedDecision | null;
  decision: SavedDecision | null;
}

export interface ClassResultStats {
  students: number;
  ranked: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  passed: number;
  pass_rate: number | null;
}

export interface ClassResults {
  school_class: { id: string; name: string; level: string; academic_year: string };
  period: ResultPeriodInfo;
  pass_mark: number;
  stats: ClassResultStats;
  rows: ClassResultRow[];
}

/** Bilan du passage d'une classe à l'année suivante. */
export interface PromotionSummary {
  promoted: number;
  repeated: number;
  excluded: number;
  /** Sans décision enregistrée : à valider avant de relancer le passage. */
  undecided: number;
  already_enrolled: number;
  /** Redoublants laissés de côté faute de classe de redoublement choisie. */
  without_class: number;
  inactive: number;
}

export interface SubjectResult {
  subject_id: string;
  subject: string;
  code: string;
  coefficient: number;
  average: number;
  grades_count: number;
}

export interface StudentPeriodResult extends ResultPeriodInfo {
  average: number | null;
  rank: number | null;
  /** Nombre d'élèves classés dans la classe ; `null` sans inscription. */
  ranked_count: number | null;
  mention: string | null;
  subjects: SubjectResult[];
}

export interface StudentResults {
  student: { id: string; name: string; matricule: string };
  academic_year: string;
  school_class: { id: string; name: string; level: string } | null;
  pass_mark: number;
  periods: StudentPeriodResult[];
  suggested_decision: SuggestedDecision | null;
  decision: SavedDecision | null;
}
