// ═══════════════════════════════════════════════════════════════════
// FILE 5
// Path:     src/app/home/layout.tsx
// Action:   CREATE (new file)
// Purpose:  Ensures /home is protected — redirects unauthenticated
//           users back to the landing page.
// ═══════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getRequestAuthSession().catch(() => null);
  if (!session) {
    redirect("/");
  }
  return <>{children}</>;
}