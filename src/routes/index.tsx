import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Compass, 
  Brain, 
  Atom, 
  Play, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Database,
  Rocket
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      title: "AI Tutor",
      description: "Chat with an intelligent agent to ask conceptually challenging physics questions, request summaries, and get step-by-step guides.",
      icon: Brain,
      color: "var(--neon-purple)",
      delay: 0.1,
    },
    {
      title: "Formula Lab",
      description: "Manipulate variables, recalculate results dynamically, and observe real-time graphs and charts mapped directly from mathematical formulas.",
      icon: Atom,
      color: "var(--neon-cyan)",
      delay: 0.2,
    },
    {
      title: "Interactive Simulations",
      description: "Launch physics sandboxes (laws of motion, orbits, projectile simulations) with active collision models, vectors, and rendering overrides.",
      icon: Play,
      color: "var(--neon-blue)",
      delay: 0.3,
    },
    {
      title: "Progress Tracking",
      description: "Observe your learning milestone timeline, track subject mastery index scores, and review conceptual completion details.",
      icon: TrendingUp,
      color: "var(--neon-purple)",
      delay: 0.4,
    },
  ];

  return (
    <div className="min-h-screen relative bg-[#09080F] text-foreground font-sans overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/2 w-[600px] h-[600px] rounded-full bg-[var(--neon-purple)]/20 blur-[130px] -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full bg-[var(--neon-cyan)]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[10%] w-[400px] h-[400px] rounded-full bg-[var(--neon-blue)]/10 blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-white/[0.01] backdrop-blur-md relative z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--neon-purple)] to-[var(--neon-cyan)] flex items-center justify-center glow-purple">
            <Compass className="w-5.5 h-5.5 text-white group-hover:rotate-45 transition-transform" />
          </div>
          <span className="text-xl font-bold tracking-wider font-mono">Edu<span className="text-gradient">Sim</span></span>
        </Link>

        <div>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold tracking-wide transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-xs font-semibold tracking-wide hover:scale-[1.02] transition-transform duration-300 shadow-lg glow-purple"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="py-12 md:py-20 grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Info Column */}
        <div className="lg:col-span-7 text-center lg:text-left space-y-8 flex flex-col justify-center">
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/30 text-xs text-[var(--neon-cyan)] font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 animate-pulse" /> Where Science Meets Simulation
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white"
            >
              Simulate. Interact. <br />
              <span className="text-gradient font-black bg-gradient-to-r from-[var(--neon-purple)] via-[var(--neon-blue)] to-[var(--neon-cyan)]">Master Physics.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              EduSim brings physics constants and formulas to life. Step into an immersive classroom synthesizer with real-time vector analysis, interactive graphs, and AI tutoring.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] via-[var(--neon-blue)] to-[var(--neon-cyan)] text-white font-bold text-sm tracking-wide shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform duration-300 flex items-center justify-center gap-2 glow-purple cursor-pointer"
            >
              Get Started <Rocket className="w-4 h-4" />
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wide hover:scale-[1.03] transition-transform duration-300 text-center"
            >
              Create Free Account
            </Link>
          </motion.div>
        </div>

        {/* Right 3D Illustration Column */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative w-full max-w-[420px] aspect-square rounded-[32px] overflow-hidden glass-strong border border-white/10 shadow-[0_0_80px_-15px_rgba(139,92,246,0.25)] p-4 bg-[#090e24]/40"
          >
            {/* Ambient glows behind image */}
            <div className="absolute top-1/2 left-1/2 w-[140%] h-[140%] rounded-full bg-[radial-gradient(circle_at_center,var(--neon-purple)/20_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            {/* The Illustration */}
            <img 
              src="/hero_illustration.png" 
              alt="EduSim Futuristic Laboratory" 
              className="w-full h-full object-cover rounded-[24px] select-none hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            
            {/* Perspective grid overlay */}
            <div 
              className="absolute bottom-4 left-4 right-4 h-24 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none rounded-[16px]" 
              style={{ 
                transform: "perspective(150px) rotateX(60deg) scaleY(1.2)", 
                transformOrigin: "bottom center",
                maskImage: "radial-gradient(ellipse 60% 50% at 50% 100%, black, transparent)"
              }} 
            />
          </motion.div>
        </div>
        </div>

        {/* Feature Cards Section */}
        <div className="w-full pt-16 pb-8 space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Interactive Modules</h2>
            <p className="text-sm text-muted-foreground">Four tools designed to enrich your learning experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: feature.delay, duration: 0.5 }}
                  className="group relative glass rounded-3xl p-6 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 flex flex-col justify-between"
                >
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 rounded-bl-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                    style={{ backgroundColor: feature.color }}
                  />
                  <div>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/10"
                      style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                    >
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <h3 className="text-md font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full glass-strong rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden text-center mx-auto max-w-4xl mb-12"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[var(--neon-purple)]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-[var(--neon-cyan)]/15 blur-3xl pointer-events-none" />
          
          <div className="relative space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">Ready to explore?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Step inside our virtual physical playground, synthesis new vectors, and accelerate your physics understanding today.
            </p>
            <Link
              to="/signup"
              className="inline-flex px-8 py-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            >
              Join EduSim Today
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/5 bg-white/[0.005] backdrop-blur-3xl text-center relative z-10">
        <p className="text-xs text-muted-foreground font-mono">
          EduSim — Developed for next generation digital physics classrooms
        </p>
      </footer>

    </div>
  );
}
