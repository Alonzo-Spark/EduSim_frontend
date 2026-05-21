import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingButton } from "@/components/layout/FloatingButton";
import { useSidebarStore } from "@/store/useSidebarStore";
import "katex/dist/katex.min.css";

import appCss from "../styles.css?url";

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 768);
    updateDesktop();
    window.addEventListener("resize", updateDesktop);
    return () => window.removeEventListener("resize", updateDesktop);
  }, []);
  
  return (
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
        <div className={`flex-1 overflow-x-hidden ${routerState.location.pathname.startsWith('/tutor') ? 'overflow-hidden p-0' : 'overflow-y-auto pt-28 pb-12 px-4 md:px-10 custom-scrollbar scroll-smooth'}`}>
          <div className={`mx-auto w-full h-full ${routerState.location.pathname.startsWith('/tutor') ? 'max-w-none' : 'max-w-[1500px]'}`}>
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
      
      <FloatingButton />
    </div>
  );
}
