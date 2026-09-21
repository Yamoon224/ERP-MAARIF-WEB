import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

// Le jeton voyage dans l'adresse : ne pas la transmettre en Referer aux sites tiers.
export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer" };

export default async function ParentResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; matricule?: string | string[] }>;
}) {
  const { token, matricule } = await searchParams;

  return (
    <ResetPasswordForm audience="parent" token={typeof token === "string" ? token : ""} identity={typeof matricule === "string" ? matricule : ""} />
  );
}
