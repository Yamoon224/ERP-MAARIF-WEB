"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Hourglass, Pencil, Search, Trash2, UserCheck, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { listClassesOfYear } from "@/lib/api/academics";
import { changeAdmissionStatus, deleteAdmission, enrollAdmission, getAdmission } from "@/lib/api/admissions";
import { getErrorMessage } from "@/lib/api/error";
import type { Admission, AdmissionEnrollment, AdmissionStatus, SchoolClass, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { ADMISSION_LABEL, ADMISSION_TONE } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/utils/format";

type DecidableStatus = Exclude<AdmissionStatus, "pending" | "enrolled">;

const ACTIONS: ReadonlyArray<{ status: DecidableStatus; label: string; icon: typeof Check; variant: "primary" | "secondary" | "danger" }> = [
  { status: "under_review", label: "Mettre en étude", icon: Search, variant: "secondary" },
  { status: "accepted", label: "Admettre", icon: Check, variant: "primary" },
  { status: "waitlisted", label: "Liste d'attente", icon: Hourglass, variant: "secondary" },
  { status: "rejected", label: "Refuser", icon: X, variant: "danger" },
];

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="text-muted">{label} : </span>
      {children || "—"}
    </p>
  );
}

export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "admissions.manage");

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [note, setNote] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<AdmissionEnrollment | null>(null);

  useEffect(() => {
    getAdmission(id)
      .then(setAdmission)
      .catch(() => setError("Candidature introuvable."));
  }, [id]);

  const academicYear = admission?.academic_year;
  const isAccepted = admission?.status === "accepted";

  useEffect(() => {
    if (!academicYear || !isAccepted) return;

    listClassesOfYear(academicYear)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [academicYear, isAccepted]);

  async function handleStatus(status: DecidableStatus) {
    if (status === "rejected" && !note.trim()) {
      setError("Un refus doit être motivé : saisissez le motif dans la note.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setAdmission(await changeAdmissionStatus(id, status, note.trim() || undefined));
      setNote("");
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de changer le statut."));
    } finally {
      setBusy(false);
    }
  }

  async function handleEnroll() {
    const classId = selectedClassId || classes[0]?.id;
    if (!classId) return;

    setBusy(true);
    setError(null);

    try {
      const result = await enrollAdmission(id, classId);
      setEnrollment(result);
      setAdmission(result.application);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible d'inscrire ce candidat."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement ce dossier de candidature ?")) return;

    setBusy(true);
    setError(null);

    try {
      await deleteAdmission(id);
      router.push("/admissions");
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de supprimer ce dossier."));
      setBusy(false);
    }
  }

  if (!admission) {
    return error ? <Alert>{error}</Alert> : <p className="text-sm text-muted">Chargement...</p>;
  }

  const isEnrolled = admission.status === "enrolled";

  return (
    <div className="space-y-6">
      <PageHeader
        title={admission.full_name}
        description={`${admission.reference} · ${admission.level} · ${admission.academic_year}`}
        actions={
          <>
            <Badge tone={ADMISSION_TONE[admission.status]}>{ADMISSION_LABEL[admission.status]}</Badge>
            {canManage && !isEnrolled && (
              <Link href={`/admissions/${id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Pencil className="size-4" aria-hidden="true" /> Modifier le dossier
              </Link>
            )}
            <Link href="/admissions" className="text-sm font-medium text-primary hover:underline">
              ← Toutes les candidatures
            </Link>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Candidat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Sexe">{admission.gender === "M" ? "Masculin" : "Féminin"}</Info>
            <Info label="Naissance">{admission.birth_date ? formatDate(admission.birth_date) : null}</Info>
            <Info label="Établissement d'origine">{admission.previous_school}</Info>
            <Info label="Déposée le">{formatDate(admission.submitted_on)}</Info>
            <Info label="Remarques">{admission.notes}</Info>
          </CardContent>
        </Card>

        <Card accent="academics">
          <CardHeader>
            <CardTitle>Tuteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Nom">{admission.guardian_name}</Info>
            <Info label="Téléphone">{admission.guardian_phone}</Info>
            <Info label="E-mail">{admission.guardian_email}</Info>
            <Info label="Adresse">{admission.address}</Info>
          </CardContent>
        </Card>
      </div>

      {admission.decided_at && (
        <Card accent="neutral">
          <CardHeader>
            <CardTitle>Dernière décision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Le">{formatDateTime(admission.decided_at)}</Info>
            <Info label="Par">{admission.decided_by?.name}</Info>
            <Info label="Note">{admission.decision_note}</Info>
            <Info label="Tuteur notifié">{admission.notified_at ? `Oui, le ${formatDateTime(admission.notified_at)}` : "Non"}</Info>
          </CardContent>
        </Card>
      )}

      {canManage && !isEnrolled && (
        <Card accent="discipline">
          <CardHeader>
            <CardTitle>Instruire le dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              Admettre, mettre en liste d&apos;attente ou refuser prévient aussitôt le tuteur par e-mail ou SMS. La mise en étude reste interne.
            </p>
            <div>
              <Label htmlFor="decision-note">Note (obligatoire pour un refus)</Label>
              <Textarea
                id="decision-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Motif ou commentaire lié à la décision"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map(({ status, label, icon: Icon, variant }) => (
                <Button
                  key={status}
                  type="button"
                  variant={variant}
                  disabled={busy || admission.status === status}
                  onClick={() => handleStatus(status)}
                >
                  <Icon className="size-4" /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {canManage && isAccepted && (
        <Card accent="grades">
          <CardHeader>
            <CardTitle>Inscrire dans une classe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 ? (
              <p className="text-sm text-muted">
                Aucune classe n&apos;existe pour l&apos;année {admission.academic_year} : créez-la d&apos;abord dans{" "}
                <Link href="/classes" className="font-medium text-primary hover:underline">
                  Classes
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-medium text-foreground">
                  Classe
                  <Select className="mt-1.5 w-56" value={selectedClassId || classes[0].id} onChange={(event) => setSelectedClassId(event.target.value)}>
                    {classes.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button type="button" loading={busy} onClick={handleEnroll}>
                  <UserCheck className="size-4" /> Inscrire l&apos;élève
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {enrollment && (
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Élève inscrit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted">Remettez ces identifiants au tuteur : le mot de passe ne sera plus jamais affiché en clair.</p>
            <div className="rounded-md border border-border bg-background p-4 font-mono">
              <p>Matricule : {enrollment.student.matricule}</p>
              <p>Mot de passe : {enrollment.initial_password}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isEnrolled && !enrollment && admission.student && (
        <Card accent="grades">
          <CardContent className="flex flex-wrap items-center gap-3 pt-5 text-sm">
            <Clock className="size-4 text-muted" aria-hidden="true" />
            Inscrit le {formatDateTime(admission.enrolled_at)} · matricule <span className="font-mono">{admission.student.matricule}</span>
            <Link href={`/students/${admission.student.id}`} className="font-medium text-primary hover:underline">
              Ouvrir le dossier de l&apos;élève
            </Link>
          </CardContent>
        </Card>
      )}

      {canManage && !isEnrolled && (
        <div>
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={handleDelete}>
            <Trash2 className="size-4" /> Supprimer le dossier
          </Button>
        </div>
      )}
    </div>
  );
}
