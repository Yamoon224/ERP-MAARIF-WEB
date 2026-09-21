import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ParentForgotPasswordPage() {
  return <ForgotPasswordForm audience="parent" />;
}
