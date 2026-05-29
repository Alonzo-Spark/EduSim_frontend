import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Terminal, Lock, Unlock, User, Wrench } from "lucide-react";
import "katex/dist/katex.min.css";

import appCss from "../styles.css?url";

const PUBLIC_ROUTE_ALLOWLIST = new Set([
  "/",
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
  const { isAuthenticated, checkAuth, devLogin, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);
  
  const [bypassRedirects, setBypassRedirects] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("dev-bypass-redirects") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dev-bypass-redirects", String(bypassRedirects));
    }
  }, [bypassRedirects]);

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
  const isLandingOrAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";
  const requiresAuth = !isPublicRoute(pathname);

  useEffect(() => {
    if (!authChecked || bypassRedirects) {
      return;
    }

    if (!isAuthenticated && requiresAuth) {
      navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH });
    } else if (isAuthenticated && isAuthPage) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, requiresAuth, navigate, isAuthPage, authChecked, bypassRedirects]);

  const renderDevConsole = () => {
    const isDev = import.meta.env.DEV;
    if (!isDev) return null;

    return (
      <div className="fixed bottom-6 left-6 z-[99999] font-sans">
        <AnimatePresence>
          {devConsoleOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-3 w-80 rounded-3xl border border-white/10 bg-[#0c1130]/95 p-5 shadow-[0_15px_50px_-10px_rgba(245,158,11,0.25)] backdrop-blur-xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white tracking-tight">EduSim Dev Console</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">LOCAL DEV</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-200">Bypass Router Guards</span>
                    <span className="text-[10px] text-gray-400">View auth pages while logged in</span>
                  </div>
                  <button
                    onClick={() => setBypassRedirects(!bypassRedirects)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${bypassRedirects ? "bg-amber-500" : "bg-white/15"}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${bypassRedirects ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Auth Status</span>
                    <span className={`font-semibold flex items-center gap-1.5 ${isAuthenticated ? "text-emerald-400" : "text-rose-400"}`}>
                      {isAuthenticated ? (
                        <><Unlock className="w-3.5 h-3.5" /> Authenticated</>
                      ) : (
                        <><Lock className="w-3.5 h-3.5" /> Unauthenticated</>
                      )}
                    </span>
                  </div>

                  {isAuthenticated && user && (
                    <div className="flex items-start gap-2 pt-2 border-t border-white/5 mt-1.5 text-left">
                      <User className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-xs leading-normal">{user.name}</span>
                        <span className="text-[10px] text-gray-400 leading-normal">{user.email} • {user.role}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      devLogin();
                      if (!bypassRedirects) {
                        navigate({ to: "/dashboard" });
                      }
                    }}
                    disabled={isAuthenticated}
                    className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/20 text-amber-300 text-xs font-bold transition-all"
                  >
                    Dev Login
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH });
                    }}
                    disabled={!isAuthenticated}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-500/20 text-rose-300 text-xs font-bold transition-all"
                  >
                    Dev Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setDevConsoleOpen(!devConsoleOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 cursor-pointer ${devConsoleOpen ? "bg-amber-500 text-white border-amber-400 rotate-90" : "bg-[#0c1130]/90 text-amber-400 border-amber-500/30 hover:border-amber-400 hover:text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"}`}
        >
          <Wrench className="w-5 h-5" />
        </motion.button>
      </div>
    );
  };

  if (isLandingOrAuthPage) {
    return (
      <>
        <div className="min-h-screen w-full relative bg-[#09080F] text-foreground overflow-y-auto overflow-x-hidden custom-scrollbar">
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
        {renderDevConsole()}
      </>
    );
  }
  
  return (
    <>
      <div className="flex min-h-screen w-full relative bg-background text-foreground overflow-hidden">
        <Sidebar />
        
        <motion.main 
          initial={false}
          animate={{ 
            paddingLeft: isDesktop ? (isCollapsed ? 72 : 240) : 0
          }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative w-full"
        >
          <Navbar />
          
          {/* Main Content Scroll Container */}
          { /* When on tutor route we must avoid page scrolling and let the Tutor page manage its own fixed layout */ }
          <div className={`flex-1 overflow-x-hidden ${routerState.location.pathname.startsWith('/tutor') || routerState.location.pathname.startsWith('/sandbox') ? 'overflow-hidden p-0' : 'overflow-y-auto pt-28 pb-12 px-4 md:px-10 custom-scrollbar scroll-smooth'}`}>
            <div className={`mx-auto w-full h-full ${routerState.location.pathname.startsWith('/tutor') || routerState.location.pathname.startsWith('/sandbox') ? 'max-w-none' : 'max-w-[1500px]'}`}>
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
                  className="w-full h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.main>
      </div>
      {renderDevConsole()}
    </>
  );
}
