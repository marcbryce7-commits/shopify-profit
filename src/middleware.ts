export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all dashboard routes
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
