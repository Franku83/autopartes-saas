import { withAuth } from "next-auth/middleware";

// Expose these paths to everyone.
const publicRoutes = ["/public", "/login", "/register", "/api/auth", "/api/register"];

export default withAuth(
  function middleware() {
    // Middleware implementation logic can go here.
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        
        // Check if path is public.
        const isPublic = publicRoutes.some(route => 
          path === route || path.startsWith(route + "/")
        );
        if (isPublic) return true;

        // Otherwise, a token is required (forces redirect to login).
        return !!token;
      },
    },
  }
);

export const config = {
  // We match everything except Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
