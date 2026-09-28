import { CheckInView } from "@/components/portal/CheckInView";

export default async function ParentCheckInPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;

  return <CheckInView initialToken={typeof token === "string" ? token : ""} />;
}
