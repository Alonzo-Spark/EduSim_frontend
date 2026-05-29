import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore } from "@/store/useAuthStore";
import "katex/dist/katex.min.css";

import appCss from "../styles.css?url";

const PUBLIC_ROUTE_ALLOWLIST = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const normalizePathname = (pathname: string) => {
  if (!pathname) {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const isPublicRoute = (pathname: string) => PUBLIC_ROUTE_ALLOWLIST.has(normalizePathname(pathname));

const EMPTY_LOGIN_SEARCH = {
  verify_token: "",
  reset_token: "",
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong rounded-3xl p-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in space</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page drifted into a black hole.</p>
        <Link
          to="/"
          className="mt-6 inline-flex px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-sm font-medium glow-purple"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EduSim — Interactive Learning Simulations" },
      {
        name: "description",
        content: "Explore classes, subjects, and immersive science simulations.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const routerState = useRouterState();
  const { isCollapsed } = useSidebarStore();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const authScrollRef = useRef<HTMLDivElement>(null);
  const appScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    updateDesktop();
    window.addEventListener("resize", updateDesktop);
    return () => window.removeEventListener("resize", updateDesktop);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const verifySession = async () => {
      await checkAuth();
      if (!cancelled) {
        setAuthChecked(true);
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  const pathname = normalizePathname(routerState.location.pathname);
  const isRootRoute = pathname === "/";
  const isLandingOrAuthPage = pathname === "/login" || pathname === "/signup";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const requiresAuth = !isPublicRoute(pathname);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (isRootRoute) {
      navigate({
        to: isAuthenticated ? "/dashboard" : "/login",
        search: isAuthenticated ? undefined : EMPTY_LOGIN_SEARCH,
      });
      return;
    }

    if (!isAuthenticated && requiresAuth) {
      navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH });
    } else if (isAuthenticated && isAuthPage) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, requiresAuth, navigate, isAuthPage, authChecked, isRootRoute, pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  const routeScrollKey = `${pathname}::${JSON.stringify(routerState.location.search ?? {})}`;
  useScrollRestoration(isLandingOrAuthPage ? authScrollRef : appScrollRef, routeScrollKey);

  if (isLandingOrAuthPage) {
    return (
      <div ref={authScrollRef} className="min-h-screen w-full relative bg-background text-foreground overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={routerState.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Fixed-layout routes (Tutor, Sandbox) own their internal layout.
  // All other routes share the viewport-bounded content scroll container below.
  const isFixedLayout =
    routerState.location.pathname.startsWith("/tutor") ||
    routerState.location.pathname.startsWith("/sandbox");

  return (
    /*
     * LAYOUT ARCHITECTURE
     * ─────────────────────────────────────────────────────────────────
     * h-screen overflow-hidden on the outermost div locks the entire shell
     * to exactly viewport height. Nothing overflows out to the window.
     * The sidebar is `position: fixed` so it does NOT participate in flex.
     *
     * motion.main (flex-1, no explicit height) fills the full viewport
     * height via align-items:stretch on the parent h-screen flex-row.
     *
     * The content div (flex-1 overflow-y-auto) fills the remaining height
     * after the Navbar. Because its height is bounded by the viewport-
     * constrained parent chain, overflow-y-auto actually activates and
     * this div becomes the sole scroll surface.
     *
     * Pages that fit the viewport → no scrollbars (curriculum pages ✓)
     * Pages with more content     → only the content area scrolls (dashboard ✓)
     * Tutor / Sandbox             → overflow-hidden, page controls own layout ✓
     */
    <div className="flex h-screen w-full overflow-hidden relative bg-background text-foreground">
      <Sidebar />

      <motion.main
        initial={false}
        animate={{
          paddingLeft: isDesktop ? (isCollapsed ? 72 : 240) : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="flex-1 min-w-0 flex flex-col relative w-full"
      >
        <Navbar />

        {/*
          Standard routes: flex-1 overflow-y-auto — bounded by the h-screen parent,
          so this div scrolls when content exceeds the available area.
          Fixed routes: overflow-hidden — Tutor/Sandbox control their own layout.
        */}
        <div
          ref={isFixedLayout ? undefined : appScrollRef}
          className={`flex-1 overflow-x-hidden ${
            isFixedLayout
              ? "overflow-hidden p-0"
              : "overflow-y-auto pt-28 pb-12 px-4 md:px-10 custom-scrollbar"
          }`}
        >
          <div
            className={`mx-auto w-full ${
              isFixedLayout ? "h-full max-w-none" : "max-w-[1500px]"
            }`}
          >
            {/*
              Directly rendering Outlet here fixes the "manual refresh" bug.
              PageTransition was causing component unmounting/remounting issues
              that interfered with TanStack Router's internal state.
            */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={routerState.location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`w-full ${isFixedLayout ? "h-full" : ""}`}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
