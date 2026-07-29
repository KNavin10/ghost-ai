import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

function AuthLayout({
  children,
  eyebrow,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section className="hidden border-r border-border bg-card lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            G
          </span>
          Ghost AI
        </div>

        <div className="max-w-sm">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <ul className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Start each idea in a focused project.</li>
            <li>Keep your creative work organized in one place.</li>
            <li>Return to the editor whenever inspiration strikes.</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          A focused workspace for your next idea.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </section>
    </main>
  );
}

export { AuthLayout };
