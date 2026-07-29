import { SignIn } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout
      description="Sign in to continue building with the ideas and projects that matter to you."
      eyebrow="Welcome back"
      title="Your creative workspace is ready."
    >
      <SignIn />
    </AuthLayout>
  );
}
