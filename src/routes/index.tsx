import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    const { isAuthenticated } = useAuthStore.getState();
    const isAuthed = isAuthenticated || !!token;

    throw redirect({
      to: isAuthed ? "/dashboard" : "/login",
      search: isAuthed ? undefined : { verify_token: "", reset_token: "" },
    });
  },
  component: LandingPage,
});

function LandingPage() {
  useEffect(() => {
    console.log("Home page mounted");
    console.log("Dashboard data", null);
    console.log("Loading state", false);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6 min-h-[50vh]">
      <div className="animate-pulse space-y-4 w-full max-w-xl">
        <div className="h-8 bg-secondary rounded-2xl w-3/4" />
        <div className="h-48 bg-secondary rounded-3xl" />
        <div className="h-8 bg-secondary rounded-2xl w-1/2" />
      </div>
    </div>
  );
}
