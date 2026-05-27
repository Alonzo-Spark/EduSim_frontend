import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, PageWrapper } from "@/components/Card";
import { CLASSES } from "@/data/curriculum";
import { 
  Sparkles, 
  BookOpen, 
  Atom, 
  Brain, 
  TrendingUp, 
  Play, 
  Compass,
  ArrowRight,
  BookOpenCheck,
  User,
  GraduationCap,
  FlaskConical
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const EMPTY_LOGIN_SEARCH = {
  verify_token: "",
  reset_token: "",
};

const EMPTY_TUTOR_SEARCH = {
  subject: undefined,
  class_name: undefined,
  chapter: undefined,
  topic: undefined,
  prompt: undefined,
};

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const mockProgress = [
    { subject: "Laws of Motion", progress: 75, grade: "Class 9", lastActive: "2 hours ago" },
    { subject: "Gravitation", progress: 40, grade: "Class 9", lastActive: "1 day ago" },
    { subject: "Light & Optics", progress: 10, grade: "Class 10", lastActive: "3 days ago" },
  ];

  return (
    <PageWrapper>
      {/* Welcome Banner */}
      <section className="glass-strong rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[var(--neon-purple)]/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-[var(--neon-cyan)]/20 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/30 text-xs text-[var(--neon-cyan)] font-mono mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              {user?.role === "teacher" ? "TEACHER DASHBOARD" : "STUDENT DASHBOARD"}
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-3 tracking-tight"
            >
              Welcome back, <span className="text-gradient font-extrabold">{user?.name || "Explorer"}</span>! 🚀
            </motion.h1>
            <p className="text-muted-foreground max-w-xl text-base">
              Dive back into your simulations or ask the AI Tutor to explain complex physics concepts in real-time.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/90">
              Signed in as <span className="font-medium text-foreground">{user?.email || "unknown"}</span>
            </p>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH });
            }}
            className="px-5 py-2.5 rounded-2xl glass hover:bg-destructive/15 text-sm font-medium transition-all duration-300 border border-white/5 hover:border-destructive/30 flex items-center gap-2 hover:scale-[1.02]"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            Sign Out
          </button>
        </div>
      </section>

      <section className="glass rounded-3xl p-6 border border-white/5 mb-8">
        <h2 className="text-xl font-bold tracking-tight mb-5">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/tutor" search={EMPTY_TUTOR_SEARCH} className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:border-[var(--neon-purple)]/50 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="w-4 h-4 text-[var(--neon-purple)]" /> AI Tutor</div>
          </Link>
          <Link to="/formula-lab/$topic" params={{ topic: "laws-of-motion" }} className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:border-[var(--neon-cyan)]/50 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold"><Atom className="w-4 h-4 text-[var(--neon-cyan)]" /> Formula Lab</div>
          </Link>
          <Link to="/simulation/$topic" params={{ topic: "laws-of-motion" }} className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:border-[var(--neon-blue)]/50 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold"><FlaskConical className="w-4 h-4 text-[var(--neon-blue)]" /> Simulations</div>
          </Link>
          <Link to="/progress" className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="w-4 h-4 text-emerald-400" /> Progress</div>
          </Link>
          <Link to="/profile" className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:border-amber-400/50 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold"><User className="w-4 h-4 text-amber-400" /> Profile</div>
          </Link>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Core Tools Section */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-bold tracking-tight">Interactive Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Tutor Card */}
            <Link to="/tutor" search={EMPTY_TUTOR_SEARCH}>
              <div className="group h-full glass rounded-3xl p-6 border border-white/5 hover:border-[var(--neon-purple)]/30 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-purple)]/10 rounded-bl-full blur-2xl group-hover:bg-[var(--neon-purple)]/20 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[var(--neon-purple)]/25 border border-[var(--neon-purple)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    AI Tutor
                    <Sparkles className="w-4 h-4 text-[var(--neon-cyan)] animate-pulse" />
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about physics? Chat with our intelligent assistant to learn via interactive discussions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--neon-purple)] font-medium group-hover:translate-x-1.5 transition-transform">
                  Start Chatting <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Formula Lab Card */}
            <Link to="/formula-lab/$topic" params={{ topic: "laws-of-motion" }}>
              <div className="group h-full glass rounded-3xl p-6 border border-white/5 hover:border-[var(--neon-cyan)]/30 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-cyan)]/10 rounded-bl-full blur-2xl group-hover:bg-[var(--neon-cyan)]/20 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[var(--neon-cyan)]/25 border border-[var(--neon-cyan)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Atom className="w-6 h-6 text-[var(--neon-cyan)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Formula Lab</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experiment with physics variables and see how constants change parameters, plots, and motion equations instantly.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--neon-cyan)] font-medium group-hover:translate-x-1.5 transition-transform">
                  Explore Formulas <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Simulations Card */}
            <Link to="/my-simulations">
              <div className="group h-full glass rounded-3xl p-6 border border-white/5 hover:border-[var(--neon-blue)]/30 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-blue)]/10 rounded-bl-full blur-2xl group-hover:bg-[var(--neon-blue)]/20 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[var(--neon-blue)]/25 border border-[var(--neon-blue)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-[var(--neon-blue)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Simulations Library</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discover and interact with standard physics simulations like Projectile Motion, Gravitational Orbit, and pendulum oscillations.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--neon-blue)] font-medium group-hover:translate-x-1.5 transition-transform">
                  Launch Simulations <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* AI Generator Card */}
            <Link to="/simulation-generator">
              <div className="group h-full glass rounded-3xl p-6 border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">AI Simulation Builder</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe a physics concept, and the Educational Intelligence synthesis engine will dynamically build a custom simulation.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium group-hover:translate-x-1.5 transition-transform">
                  Synthesize Simulation <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Sidebar Panel - Progress Tracker */}
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Active Topics</h2>
            <Link to="/progress" className="text-xs text-[var(--neon-cyan)] hover:underline flex items-center gap-1">
              View all <TrendingUp className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-6">
            {mockProgress.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="font-semibold text-foreground">{item.subject}</div>
                  <div className="text-muted-foreground text-xs">{item.lastActive}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpenCheck className="w-3.5 h-3.5 text-[var(--neon-purple)]" />
                  {item.grade}
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Mastery Level</span>
                    <span className="text-[var(--neon-cyan)] font-semibold">{item.progress}%</span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-white/10">
                    <div 
                      style={{ width: `${item.progress}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Curriculum Class Selector Section */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold mb-6 tracking-tight font-sans">Explore Curriculum</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CLASSES.map((c, i) => (
            <Link key={c.id} to="/subjects/$classId" params={{ classId: String(c.id) }}>
              <Card delay={i * 0.04}>
                <div className="text-xs text-[var(--neon-cyan)] font-mono mb-2">CLASS</div>
                <div className="text-3xl font-bold text-gradient mb-2">{c.id}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="mt-3 text-xs text-muted-foreground">{c.subjects.length} subjects</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

    </PageWrapper>
  );
}
