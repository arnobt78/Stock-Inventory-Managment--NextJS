import { Suspense } from "react";
import EmailPreferencesPage from "@/components/Pages/EmailPreferencesPage";

/**
 * Admin Email Preferences — same form as /settings/email-preferences but inside admin layout.
 * REQ-0021 — shell renders immediately; preferences hydrate client-side.
 */
export default function AdminEmailPreferencesPage() {
  return (
    <Suspense fallback={<EmailPreferencesPage embedded />}>
      <EmailPreferencesPage embedded />
    </Suspense>
  );
}
