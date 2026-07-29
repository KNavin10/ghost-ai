import { SignUp } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout
      description="Create an account to begin shaping your next idea in a focused creative workspace."
      eyebrow="Create your account"
      title="A clear place to begin."
    >
      <SignUp />
    </AuthLayout>
  );
}
