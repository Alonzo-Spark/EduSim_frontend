import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Smartphone, 
  KeyRound, 
  Chrome, 
  Brain,
  Atom,
  Play,
  TrendingUp,
  Compass, 
  Eye, 
  EyeOff,
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      verify_token: (search.verify_token as string) || undefined,
      reset_token: (search.reset_token as string) || undefined,
    };
  },
  component: Login,
});

function Login() {
  const { verify_token, reset_token } = Route.useSearch();
  const navigate = useNavigate();
  
  const { 
    login, 
    sendOtp, 
    verifyOtp, 
    forgotPassword, 
    resetPassword, 
    verifyEmail,
    isLoading 
  } = useAuthStore();

  // Tab State: "email" | "otp"
  const [activeTab, setActiveTab] = useState<"email" | "otp">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Mobile form state
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const otpInputs = useRef<HTMLInputElement[]>([]);
  const [countdown, setCountdown] = useState(60);
  
  // Sub-screens
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Floating particles state and generator
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 8 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, []);

  // Handle Verify Token (on mount)
  useEffect(() => {
    if (verify_token) {
      const runVerify = async () => {
        const success = await verifyEmail(verify_token);
        if (success) {
          toast.success("Account activated successfully! You can now log in.");
          navigate({ to: "/login", replace: true });
        }
      };
      runVerify();
    }
  }, [verify_token, verifyEmail, navigate]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please enter your email and password");
      return;
    }
    const success = await login({ email, password });
    if (success) {
      navigate({ to: "/dashboard" });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) {
      toast.warning("Please enter your mobile number");
      return;
    }
    const success = await sendOtp(countryCode, mobileNumber);
    if (success) {
      setOtpSent(true);
      setCountdown(60);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    const completedOtp = newOtp.join("");
    if (completedOtp.length === 6) {
      triggerOtpVerify(completedOtp);
    }
  };

  const triggerOtpVerify = async (completedOtp: string) => {
    const success = await verifyOtp(mobileNumber, completedOtp);
    if (success) {
      navigate({ to: "/dashboard" });
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const success = await sendOtp(countryCode, mobileNumber);
    if (success) {
      setCountdown(60);
      setOtpCode(Array(6).fill(""));
      otpInputs.current[0]?.focus();
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.warning("Please enter your email address");
      return;
    }
    const success = await forgotPassword(email);
    if (success) {
      setShowForgotForm(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.warning("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const success = await resetPassword(reset_token!, newPassword);
    if (success) {
      navigate({ to: "/login", replace: true });
    }
  };

  // Simulated Google Auth click
  const handleGoogleLogin = async () => {
    toast.info("Simulating Google OAuth connection...");
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const success = await login({ email: "student@edusim.local", password: "Password123!" });
    if (success) {
      toast.success("Welcome back! Signed in with Google.");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-[#050816] text-foreground font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-[2px] h-[2px] bg-blue-400 rounded-full opacity-60"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid min-h-[100svh] w-full max-w-[1280px] grid-cols-1 lg:grid-cols-[minmax(0,45%)_minmax(0,14%)_minmax(0,41%)] items-center gap-6 px-4 py-4 sm:px-6 md:px-8 lg:px-10 lg:py-6 mx-auto">
        
        <div className="hidden lg:flex flex-col justify-center gap-8 h-full">
          <Link to="/" className="flex items-center gap-2.5 group relative z-10 w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center glow-purple hover:rotate-12 transition-transform duration-300">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wider font-mono text-white">
              Edu<span className="text-gradient bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">Sim</span>
            </span>
          </Link>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18182d] border border-white/10 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider"
            >
              <Sparkles className="w-3 h-3 text-[#8B5CF6]" /> Next Generation Learning
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight"
            >
              Explore Science Through <br />
              <span className="text-gradient bg-gradient-to-r from-[#8B5CF6] via-[#3b82f6] to-[#60a5fa]">Immersive Simulations</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-[13px] leading-relaxed max-w-lg"
            >
              Step into a new era of interactive learning with AI tutors, smart simulations, and powerful formula labs.
            </motion.p>
          </div>

          <div className="space-y-4">
            {[
              { label: "AI-Powered Tutor", desc: "Get instant answers and explanations", icon: Brain, color: "#8B5CF6" },
              { label: "Interactive Simulations", desc: "High-fidelity physics engine", icon: Play, color: "#3B82F6" },
              { label: "Formula Lab Explorer", desc: "Track variables and master formulas", icon: Atom, color: "#06B6D4" },
              { label: "Progress Tracking", desc: "Detailed mastery dashboards", icon: TrendingUp, color: "#10B981" },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                  style={{
                    animation: `slideInLeft 0.6s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${f.color}12`, border: `1px solid ${f.color}25`, color: f.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-sm">
                        {f.label}
                      </h3>
                      <p className="text-xs text-gray-400">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center relative h-full min-h-[560px]">
          <div className="relative w-80 h-80">
            {/* Bright background blur core */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] opacity-50 blur-[80px] animate-pulse"></div>

            {/* Orbit 1: Diagonal Right-Leaning Ellipse */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotateX(72deg) rotateY(24deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
              <div 
                className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `orbit 8s linear infinite`,
                }}
              />
            </div>

            {/* Orbit 2: Diagonal Left-Leaning Ellipse */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotateX(72deg) rotateY(-24deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.4)]" />
              <div 
                className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `orbit 8s linear infinite`,
                  animationDelay: '-2.66s',
                }}
              />
            </div>

            {/* Orbit 3: Flatter Horizontal/Tilt Ellipse */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotateX(36deg) rotateY(48deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
              <div 
                className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `orbit 8s linear infinite`,
                  animationDelay: '-5.33s',
                }}
              />
            </div>

            {/* Bright nuclear fusion center core */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 bg-white rounded-full shadow-[0_0_20px_#ffffff,0_0_40px_#3b82f6,0_0_60px_#8b5cf6] blur-[0.8px] z-30"></div>
            </div>
          </div>

          {/* Floating physics equations (Enlarged and Glowing neon tags) */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { text: 'E = mc²', theme: 'text-cyan-300 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]', style: { top: '12%', left: '72%' } },
              { text: 'F = ma', theme: 'text-purple-300 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]', style: { bottom: '22%', left: '2%' } },
              { text: 'λ = h/p', theme: 'text-blue-300 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.35)]', style: { bottom: '12%', right: '8%' } },
            ].map((eq, idx) => (
              <div
                key={idx}
                className={`absolute font-mono text-sm font-bold border px-4 py-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md select-none transition-all duration-300 hover:scale-105 ${eq.theme}`}
                style={eq.style}
              >
                {eq.text}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[470px] mx-auto rounded-[32px] p-8 md:p-10 border border-white/[0.12] shadow-[0_24px_80px_-24px_rgba(139,92,246,0.3)] relative bg-[#0c1130]/80 backdrop-blur-3xl overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-56 h-56 rounded-full bg-[rgba(139,92,246,0.22)] blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full bg-[rgba(59,130,246,0.15)] blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
          
          <AnimatePresence mode="wait">
            {reset_token ? (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center mx-auto mb-4 glow-blue">
                    <KeyRound className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <h3 className="text-2xl font-black text-white">New Password</h3>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">NEW PASSWORD</label>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090d22] border border-white/10 text-sm text-white focus:border-[#3B82F6] outline-none" /></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">CONFIRM PASSWORD</label>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090d22] border border-white/10 text-sm text-white focus:border-[#3B82F6] outline-none" /></div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold text-sm">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
                  </button>
                </form>
              </motion.div>
            ) : showForgotForm ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <button onClick={() => setShowForgotForm(false)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white mb-6"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                <div className="mb-6"><h3 className="text-2xl font-black text-white">Reset Password</h3></div>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">EMAIL</label>
                    <div className="relative"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090d22] border border-white/10 text-sm text-white focus:border-[#8B5CF6] outline-none" /></div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold text-sm">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="signin" className="space-y-6">
                <div className="space-y-1"><h3 className="text-2xl font-black text-white">Access EduSim</h3><p className="text-xs text-muted-foreground">Sign in to continue your learning journey</p></div>
                <button onClick={handleGoogleLogin} className="w-full py-3.5 rounded-2xl bg-white text-gray-900 font-bold text-sm flex items-center justify-center gap-3"><Chrome className="w-4 h-4" /> Continue with Google</button>
                <div className="flex items-center gap-3"><div className="flex-1 h-[1px] bg-white/5" /><span className="text-[10px] text-muted-foreground font-mono">OR</span><div className="flex-1 h-[1px] bg-white/5" /></div>
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0a0f28] border border-white/10">
                  <button onClick={() => { setActiveTab("email"); setOtpSent(false); }} className={`py-3 rounded-xl text-xs font-semibold ${activeTab === "email" ? "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white" : "text-muted-foreground"}`}>Email</button>
                  <button onClick={() => setActiveTab("otp")} className={`py-3 rounded-xl text-xs font-semibold ${activeTab === "otp" ? "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white" : "text-muted-foreground"}`}>OTP</button>
                </div>
                {activeTab === "email" ? (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="relative"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0a0f28] border border-white/15 text-sm text-white focus:border-[#8B5CF6] outline-none placeholder:text-gray-500" /></div>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#0a0f28] border border-white/15 text-sm text-white focus:border-[#8B5CF6] outline-none placeholder:text-gray-500" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <label className="flex items-center gap-2 text-muted-foreground select-none cursor-pointer">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-[#0a0f28] text-[#8B5CF6] focus:ring-[#8B5CF6]" />
                        Remember me
                      </label>
                      <button type="button" onClick={() => setShowForgotForm(true)} className="text-[#8B5CF6] hover:text-[#3B82F6] transition-colors font-medium">Forgot password?</button>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold text-sm">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="flex gap-2"><input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-16 text-center rounded-2xl bg-[#0a0f28] border border-white/15 text-sm text-white outline-none" /><div className="relative flex-1"><Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" /><input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0a0f28] border border-white/15 text-sm text-white outline-none placeholder:text-gray-500" /></div></div>
                        <button type="submit" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold text-sm">Send OTP</button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center gap-2">
                          {otpCode.map((data, index) => <input key={index} maxLength={1} ref={(el) => { if (el) otpInputs.current[index] = el; }} value={data} onChange={(e) => handleOtpChange(e.target, index)} className="w-11 h-12 text-center rounded-xl bg-white/5 border border-white/10 text-lg font-bold text-white outline-none" />)}
                        </div>
                        <button onClick={handleResendOtp} disabled={countdown > 0} className="text-xs text-[#3B82F6] disabled:text-gray-600">Resend Code ({countdown}s)</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center pt-2 text-xs font-medium">
                  <span className="text-muted-foreground">New to EduSim? </span>
                  <Link to="/signup" className="text-[#3B82F6] hover:text-[#8B5CF6] transition-colors font-bold">
                    Create an account
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit { from { transform: rotate(0deg) translateY(-100px) translateX(-50%); } to { transform: rotate(360deg) translateY(-100px) translateX(-50%); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
