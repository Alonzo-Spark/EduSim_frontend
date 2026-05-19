import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
