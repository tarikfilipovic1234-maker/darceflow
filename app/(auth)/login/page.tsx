import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your darceflow gym.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your gym dashboard.</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have a gym yet?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground transition-colors hover:underline"
        >
          Start free
        </Link>
      </p>
    </div>
  );
}
