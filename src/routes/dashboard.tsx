import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, PageWrapper } from "@/components/Card";
import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculumService";
import { 
  Sparkles, 
  BookOpen, 
  Atom, 
  Brain, 
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

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: CurriculumService.getClasses,
  });

  return (
    <PageWrapper>
      {/* Welcome Banner */}
      <section className="glass-strong rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden bg-card border border-border shadow-sm">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-primary font-mono mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              {user?.role === "teacher" ? "TEACHER DASHBOARD" : "STUDENT DASHBOARD"}
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-3 tracking-tight text-foreground"
            >
              Welcome back, <span className="text-primary font-extrabold">{user?.name || "Explorer"}</span>! 🚀
            </motion.h1>
            <p className="text-muted-foreground max-w-xl text-base">
              Dive back into your simulations or ask the AI Tutor to explain complex physics concepts in real-time.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{user?.email || "unknown"}</span>
            </p>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH });
            }}
            className="px-5 py-2.5 rounded-2xl bg-card hover:bg-destructive/10 text-destructive text-sm font-semibold transition-all duration-300 border border-border hover:border-destructive/30 flex items-center gap-2 hover:scale-[1.02]"
          >
            <User className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </section>

      <section className="glass rounded-3xl p-6 border border-border bg-card mb-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight mb-5 text-foreground">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/tutor" search={EMPTY_TUTOR_SEARCH} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><Brain className="w-4 h-4 text-primary" /> AI Tutor</div>
          </Link>
          <Link to="/formula-lab/$topic" params={{ topic: "laws-of-motion" }} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><Atom className="w-4 h-4 text-primary" /> Formula Lab</div>
          </Link>
          <Link to="/simulation/$topic" params={{ topic: "laws-of-motion" }} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><FlaskConical className="w-4 h-4 text-primary" /> Simulations</div>
          </Link>
          <Link to="/profile" className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors"><User className="w-4 h-4 text-amber-500" /> Profile</div>
          </Link>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Core Tools Section */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Interactive Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Tutor Card */}
            <Link to="/tutor" search={EMPTY_TUTOR_SEARCH}>
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                    AI Tutor
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about physics? Chat with our intelligent assistant to learn via interactive discussions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold group-hover:translate-x-1.5 transition-transform">
                  Start Chatting <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Formula Lab Card */}
            <Link to="/formula-lab/$topic" params={{ topic: "laws-of-motion" }}>
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Atom className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Formula Lab</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experiment with physics variables and see how constants change parameters, plots, and motion equations instantly.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold group-hover:translate-x-1.5 transition-transform">
                  Explore Formulas <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>



            {/* AI Generator Card */}
            <Link to="/simulation-generator">
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-amber-600 transition-colors">AI Simulation Builder</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe a physics concept, and the Educational Intelligence synthesis engine will dynamically build a custom simulation.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold group-hover:translate-x-1.5 transition-transform">
                  Synthesize Simulation <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Sidebar Panel - Progress Tracker */}
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Active Topics</h2>
          </div>
          
          <div className="glass rounded-3xl p-6 border border-border bg-card space-y-6 shadow-sm">
            {mockProgress.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="font-semibold text-foreground">{item.subject}</div>
                  <div className="text-muted-foreground text-xs">{item.lastActive}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpenCheck className="w-3.5 h-3.5 text-primary" />
                  {item.grade}
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Mastery Level</span>
                    <span className="text-primary font-bold">{item.progress}%</span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-secondary">
                    <div 
                      style={{ width: `${item.progress}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rounded-full transition-all duration-500"
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
        <h2 className="text-2xl font-bold mb-6 tracking-tight font-sans text-foreground">Explore Curriculum</h2>
        {isLoading ? (
          <div className="text-muted-foreground p-4">Loading curriculum...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {classes.map((c, i) => (
              <Link key={c.id} to="/subjects/$classId" params={{ classId: String(c.id) }}>
                <Card delay={i * 0.04} className="border border-border bg-card shadow-sm hover:border-primary/50">
                  <div className="text-xs text-primary font-mono font-bold mb-2">CLASS</div>
                  <div className="text-3xl font-extrabold text-foreground mb-2">{c.id}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="mt-3 text-xs text-muted-foreground font-semibold">View Subjects</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

    </PageWrapper>
  );
}
