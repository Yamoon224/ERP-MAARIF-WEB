"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { getErrorMessage, getFieldErrors } from "@/lib/api/error";
import { createRole, updateRole } from "@/lib/api/roles";
import type { Role } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { roleSchema, type RoleFormInput } from "@/lib/validation/roles";

interface RoleFormModalProps {
  /** Rôle à renommer ; `null` pour en créer un. */
  role: Role | null;
  onClose: () => void;
  onSaved: (role: Role, created: boolean) => void;
}

/** Création ou renommage d'un rôle, dans une fenêtre. Les permissions se règlent ensuite, rôle par rôle. */
export function RoleFormModal({ role, onClose, onSaved }: RoleFormModalProps) {
  const { t } = useT();
  const isEdit = role !== null;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormInput>({ resolver: zodResolver(roleSchema), defaultValues: { name: role?.name ?? "" } });

  async function onSubmit(values: RoleFormInput) {
    setServerError(null);

    try {
      const saved = role ? await updateRole(role.id, { name: values.name }) : await createRole({ name: values.name });
      onSaved(saved, !role);
    } catch (error) {
      const nameError = getFieldErrors(error).name;

      if (nameError) setError("name", { message: nameError });
      else setServerError(getErrorMessage(error, isEdit ? t("Impossible de renommer ce rôle.") : t("Impossible de créer ce rôle.")));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={isEdit ? t("Renommer le rôle") : t("Nouveau rôle")}
      description={isEdit ? undefined : t("Vous choisirez ensuite ce que ce rôle peut faire.")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <div>
          <Label htmlFor="role-name">{t("Nom du rôle")}</Label>
          <Input id="role-name" placeholder={t("Secrétaire, Surveillant général...")} maxLength={60} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Annuler")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {isEdit ? t("Enregistrer") : t("Créer le rôle")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
