"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createUser, updateUser } from "@/lib/api/users";
import { getErrorMessage, getFieldErrors } from "@/lib/api/error";
import type { Role, StaffUser } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { userEditSchema, userSchema, type UserEditFormInput, type UserFormInput } from "@/lib/validation/users";

interface UserFormModalProps {
  /** Compte à modifier ; `null` pour en créer un. */
  user: StaffUser | null;
  /** Rôles proposés. */
  roles: Pick<Role, "name" | "label">[];
  onClose: () => void;
  /** Appelé après l'enregistrement, avec le compte enregistré. */
  onSaved: (user: StaffUser, created: boolean) => void;
}

type FormValues = UserFormInput | UserEditFormInput;

/**
 * Création et modification d'un compte du personnel, dans une fenêtre. À la création, on fixe le mot de passe
 * initial ; à la modification, il ne se change pas ici (bouton « Réinitialiser le mot de passe » de la liste).
 */
export function UserFormModal({ user, roles, onClose, onSaved }: UserFormModalProps) {
  const { t } = useT();
  const isEdit = user !== null;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({
    resolver: zodResolver(isEdit ? userEditSchema : userSchema) as never,
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      password: "",
      roles: user?.roles ?? ["teacher"],
      is_active: user?.is_active ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      roles: values.roles,
      is_active: values.is_active,
    };

    try {
      const saved = user ? await updateUser(user.id, payload) : await createUser({ ...payload, password: (values as UserFormInput).password });
      onSaved(saved, !user);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const fields = ["name", "email", "phone", "password", "roles"] as const;
      const known = fields.filter((field) => fieldErrors[field]);

      // Une erreur de champ (e-mail déjà pris...) se lit sous le champ ; le reste, en tête du formulaire.
      known.forEach((field) => setError(field, { message: fieldErrors[field] }));
      if (known.length === 0) {
        setServerError(getErrorMessage(error, isEdit ? t("Impossible de modifier ce compte.") : t("Impossible de créer ce compte.")));
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t("Modifier le compte") : t("Nouvel utilisateur")}
      description={isEdit ? user.email : t("Un compte du personnel se connecte avec son e-mail et ce mot de passe initial.")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {serverError && (
          <div className="sm:col-span-2">
            <Alert>{serverError}</Alert>
          </div>
        )}

        <div>
          <Label htmlFor="user-name">{t("Nom complet")}</Label>
          <Input id="user-name" autoComplete="off" placeholder={t("Nom complet")} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="user-email">{t("E-mail")}</Label>
          <Input id="user-email" type="email" autoComplete="off" placeholder="nom@exemple.com" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="user-phone">{t("Téléphone")}</Label>
          <Input id="user-phone" type="tel" autoComplete="off" placeholder="+224 600 00 00 00" {...register("phone")} />
          <FieldError>{errors.phone?.message}</FieldError>
        </div>

        {!isEdit && (
          <div>
            <Label htmlFor="user-password">{t("Mot de passe initial")}</Label>
            <PasswordInput id="user-password" autoComplete="new-password" placeholder={t("8 caractères minimum")} {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
        )}

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-foreground">{t("Rôles")}</legend>
          <Controller
            control={control}
            name="roles"
            render={({ field }) => (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {roles.map((role) => (
                  <Checkbox
                    key={role.name}
                    label={t(role.label)}
                    checked={field.value.includes(role.name)}
                    onChange={(event) =>
                      field.onChange(event.target.checked ? [...field.value, role.name] : field.value.filter((name) => name !== role.name))
                    }
                  />
                ))}
              </div>
            )}
          />
          <FieldError>{errors.roles?.message}</FieldError>
        </fieldset>

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Checkbox label={t("Compte actif (peut se connecter)")} checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Annuler")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {isEdit ? t("Enregistrer") : t("Créer le compte")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
