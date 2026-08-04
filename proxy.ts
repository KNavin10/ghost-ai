import { clerkMiddleware } from "@clerk/nextjs/server";

function getAuthRoutePath(route: string | undefined, fallback: string) {
  return new URL(route ?? fallback, "http://localhost").pathname.replace(/\/$/, "") || "/";
}

const publicAuthRoutes = [
  getAuthRoutePath(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, "/sign-in"),
  getAuthRoutePath(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, "/sign-up"),
];

function isPublicAuthRoute(pathname: string) {
  return publicAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function usesHandlerAuthentication(pathname: string) {
  return (
    pathname === "/api/liveblocks-auth" ||
    pathname === "/api/projects" ||
    pathname.startsWith("/api/projects/")
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (
    isPublicAuthRoute(request.nextUrl.pathname) ||
    usesHandlerAuthentication(request.nextUrl.pathname)
  ) {
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
