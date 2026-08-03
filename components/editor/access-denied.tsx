import { LockKeyhole } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-semibold">
          Project access denied
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This project does not exist, or you do not have permission to open it.
        </p>
        <Link
          className={buttonVariants({ className: "mt-6", variant: "outline" })}
          href="/editor"
        >
          Back to projects
        </Link>
      </section>
    </main>
  )
}

export { AccessDenied }
