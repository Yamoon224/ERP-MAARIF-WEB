import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

// Le jeton voyage dans l'adresse : ne pas la transmettre en Referer aux sites tiers.
export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer" };

export default async function StaffResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; email?: string | string[] }>;
}) {
  const { token, email } = await searchParams;

  return <ResetPasswordForm audience="staff" token={typeof token === "string" ? token : ""} identity={typeof email === "string" ? email : ""} />;
}
