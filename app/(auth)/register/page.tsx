import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/app/(auth)/register/register-form";

export const metadata: Metadata = {
  title: "Create your gym",
  description: "Start running your BJJ academy on darceflow.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your gym</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ll be the admin. Invite coaches and athletes from the dashboard.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
