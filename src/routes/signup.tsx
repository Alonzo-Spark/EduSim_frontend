import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  Brain,
  Check,
  Compass,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Play,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

type FieldName = "name" | "email" | "mobileNumber" | "password" | "confirmPassword" | "termsAccepted";

function Signup() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    mobileNumber: false,
    password: false,
    confirmPassword: false,
    termsAccepted: false,
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 8 + Math.random() * 4,
      }))
    );
  }, []);

  useEffect(() => {
    if (submitted) {
      setTouched({
        name: true,
        email: true,
        mobileNumber: true,
        password: true,
        confirmPassword: true,
        termsAccepted: true,
      });
    }
  }, [submitted]);

  const passwordChecks = useMemo(() => {
    const digitsOnly = mobileNumber.replace(/\D/g, "");
    return {
      name: name.trim().length >= 3,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      mobile: digitsOnly.length === 0 || /^\d{10}$/.test(digitsOnly),
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      confirm: confirmPassword.length > 0 && password === confirmPassword,
      terms: termsAccepted,
      digitsOnly,
    };
  }, [confirmPassword, email, mobileNumber, name, password, termsAccepted]);

  const isPasswordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.number && passwordChecks.special;
  const isFormValid = passwordChecks.name && passwordChecks.email && passwordChecks.mobile && isPasswordValid && passwordChecks.confirm && passwordChecks.terms;

  const showError = (field: FieldName, valid: boolean) => (touched[field] || submitted) && !valid;

  const focusFirstInvalidField = () => {
    if (!passwordChecks.name) return nameRef.current?.focus();
    if (!passwordChecks.email) return emailRef.current?.focus();
    if (!passwordChecks.mobile) return mobileRef.current?.focus();
    if (!isPasswordValid) return passwordRef.current?.focus();
    if (!passwordChecks.confirm) return confirmPasswordRef.current?.focus();
    if (!passwordChecks.terms) return termsRef.current?.focus();
  };

  const handleMobileChange = (value: string) => {
    setMobileNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (isSubmitting || isLoading) return;

    if (!isFormValid) {
      focusFirstInvalidField();
      toast.error("Please fix the highlighted fields and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: passwordChecks.digitsOnly || undefined,
      });

      if (success) {
        toast.success("Account created successfully");
        window.setTimeout(() => navigate({ to: "/login" }), 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthScore = [passwordChecks.length, passwordChecks.uppercase, passwordChecks.lowercase, passwordChecks.number, passwordChecks.special].filter(Boolean).length;
  const strength = strengthScore <= 2 ? { label: "Weak", width: "33%", color: "bg-red-500" } : strengthScore <= 4 ? { label: "Medium", width: "66%", color: "bg-amber-400" } : { label: "Strong", width: "100%", color: "bg-green-500" };

  const fieldClass = (valid: boolean, error: boolean) =>
    `w-full rounded-2xl bg-[#0a0f28] text-sm text-white outline-none placeholder:text-gray-500 transition-all duration-300 ${
      error
        ? "border border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
        : valid
          ? "border border-green-500/60 focus:border-green-500 focus:ring-2 focus:ring-green-500/25"
          : "border border-white/15 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/40"
    }`;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-[#050816] text-foreground font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]" />
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18182d] border border-white/10 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#8B5CF6]" /> Next Generation Learning
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Explore Science Through <br />
              <span className="text-gradient bg-gradient-to-r from-[#8B5CF6] via-[#3b82f6] to-[#60a5fa]">Immersive Simulations</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground text-[13px] leading-relaxed max-w-lg">
              Step into a new era of interactive learning with AI tutors, smart simulations, and powerful formula labs.
            </motion.p>
          </div>

          <div className="space-y-4">
            {[
              { label: "AI-Powered Tutor", desc: "Get instant answers and explanations", icon: Brain, color: "#8B5CF6" },
              { label: "Interactive Simulations", desc: "High-fidelity physics engine", icon: Play, color: "#3B82F6" },
              { label: "Formula Lab Explorer", desc: "Track variables and master formulas", icon: Atom, color: "#06B6D4" },
              { label: "Progress Tracking", desc: "Detailed mastery dashboards", icon: TrendingUp, color: "#10B981" },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.12)]" style={{ animation: `slideInLeft 0.6s ease-out ${index * 0.1}s both` }}>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${feature.color}12`, border: `1px solid ${feature.color}25`, color: feature.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-sm">{feature.label}</h3>
                      <p className="text-xs text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center relative h-full min-h-[560px]">
          <div className="relative w-80 h-80">
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] opacity-35 blur-[80px] animate-pulse" />
            <div className="absolute inset-0 pointer-events-none" style={{ transform: "rotateX(72deg) rotateY(24deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
              <div className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20" style={{ top: "50%", left: "50%", animation: "orbit 8s linear infinite" }} />
            </div>
            <div className="absolute inset-0 pointer-events-none" style={{ transform: "rotateX(72deg) rotateY(-24deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.4)]" />
              <div className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20" style={{ top: "50%", left: "50%", animation: "orbit 8s linear infinite", animationDelay: "-2.66s" }} />
            </div>
            <div className="absolute inset-0 pointer-events-none" style={{ transform: "rotateX(36deg) rotateY(48deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
              <div className="absolute w-4.5 h-4.5 bg-cyan-300 rounded-full shadow-[0_0_20px_#00ffff,0_0_35px_#00ffff] z-20" style={{ top: "50%", left: "50%", animation: "orbit 8s linear infinite", animationDelay: "-5.33s" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 bg-white rounded-full shadow-[0_0_20px_#ffffff,0_0_40px_#3b82f6,0_0_60px_#8b5cf6] blur-[0.8px] z-30" />
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {[
              { text: "E = mc²", theme: "text-cyan-300 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]", style: { top: "12%", left: "72%" } },
              { text: "F = ma", theme: "text-purple-300 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]", style: { bottom: "22%", left: "2%" } },
              { text: "λ = h/p", theme: "text-blue-300 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.35)]", style: { bottom: "12%", right: "8%" } },
            ].map((equation) => (
              <div key={equation.text} className={`absolute font-mono text-sm font-bold border px-4 py-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md select-none transition-all duration-300 hover:scale-105 ${equation.theme}`} style={equation.style}>
                {equation.text}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[470px] mx-auto rounded-[32px] p-8 border border-white/[0.12] shadow-[0_24px_80px_-24px_rgba(139,92,246,0.3)] relative bg-[#0c1130]/80 backdrop-blur-3xl overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-56 h-56 rounded-full bg-[rgba(139,92,246,0.22)] blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full bg-[rgba(59,130,246,0.15)] blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />

          <div className="mb-6 space-y-1 text-left">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Create Your Account
              <Sparkles className="w-5 h-5 text-[#8B5CF6] animate-pulse" />
            </h3>
            <p className="text-xs text-muted-foreground">Unlock interactive educational simulations</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-4 text-left" noValidate>
            <div className="space-y-1">
              <label htmlFor="name" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">FULL NAME</label>
              <div className="relative group/input">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-[#3B82F6] transition-colors" />
                <input id="name" ref={nameRef} type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, name: true }))} aria-invalid={showError("name", passwordChecks.name)} aria-describedby={showError("name", passwordChecks.name) ? "name-error" : undefined} className={fieldClass(passwordChecks.name, showError("name", passwordChecks.name)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("name", passwordChecks.name) && <p id="name-error" className="text-xs text-red-400">Please enter your full name</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">EMAIL ADDRESS</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-[#8B5CF6] transition-colors" />
                <input id="email" ref={emailRef} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, email: true }))} aria-invalid={showError("email", passwordChecks.email)} aria-describedby={showError("email", passwordChecks.email) ? "email-error" : undefined} className={fieldClass(passwordChecks.email, showError("email", passwordChecks.email)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("email", passwordChecks.email) && <p id="email-error" className="text-xs text-red-400">Please enter a valid email address</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="mobile" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">MOBILE NUMBER <span className="text-muted-foreground/60">(optional)</span></label>
              <div className="relative group/input">
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-[#8B5CF6] transition-colors" />
                <input id="mobile" ref={mobileRef} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} placeholder="10-digit mobile number" value={mobileNumber} onChange={(e) => handleMobileChange(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, mobileNumber: true }))} aria-invalid={showError("mobileNumber", passwordChecks.mobile)} aria-describedby={showError("mobileNumber", passwordChecks.mobile) ? "mobile-error" : undefined} className={fieldClass(passwordChecks.mobile, showError("mobileNumber", passwordChecks.mobile)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("mobileNumber", passwordChecks.mobile) && <p id="mobile-error" className="text-xs text-red-400">Please enter a valid mobile number</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">PASSWORD</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-[#8B5CF6] transition-colors" />
                <input id="password" ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, password: true }))} className={fieldClass(isPasswordValid, false) + " pl-10 pr-10 py-3"} />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 rounded-md" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-3.5 rounded-2xl bg-[#070b1f]/40 border border-white/[0.04] text-[10px]">
                  {[
                    { met: passwordChecks.length, label: "8+ characters" },
                    { met: passwordChecks.uppercase, label: "Uppercase letter" },
                    { met: passwordChecks.lowercase, label: "Lowercase letter" },
                    { met: passwordChecks.number, label: "One number" },
                    { met: passwordChecks.special, label: "Special character" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.met ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                      <span className={item.met ? "text-green-500/90 font-medium" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">CONFIRM PASSWORD</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-[#8B5CF6] transition-colors" />
                <input id="confirmPassword" ref={confirmPasswordRef} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))} aria-invalid={showError("confirmPassword", passwordChecks.confirm)} aria-describedby={showError("confirmPassword", passwordChecks.confirm) ? "confirm-password-error" : undefined} className={fieldClass(passwordChecks.confirm, showError("confirmPassword", passwordChecks.confirm)) + " pl-10 pr-10 py-3"} />
                <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 rounded-md" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showError("confirmPassword", passwordChecks.confirm) && <p id="confirm-password-error" className="text-xs text-red-400">Passwords do not match</p>}
            </div>

            <div className="space-y-2 rounded-2xl bg-[#070b1f]/40 border border-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <input id="termsAccepted" ref={termsRef} type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} onBlur={() => setTouched((current) => ({ ...current, termsAccepted: true }))} className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0a0f28] text-[#8B5CF6] focus:ring-[#8B5CF6]" />
                <label htmlFor="termsAccepted" className="text-xs text-muted-foreground leading-relaxed select-none">I agree to the <span className="text-white font-medium">Terms of Service</span> and <span className="text-white font-medium">Privacy Policy</span></label>
              </div>
              {showError("termsAccepted", passwordChecks.terms) && <p className="text-xs text-red-400">Please accept the Terms of Service and Privacy Policy</p>}
            </div>

            <button type="submit" disabled={!isFormValid || isLoading || isSubmitting} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#5c6df6] to-[#3B82F6] text-white font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 glow-purple cursor-pointer shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
              {isLoading || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1.5">Create Account <ArrowRight className="w-4 h-4" /></span>}
            </button>
          </form>

          <div className="text-center pt-4 text-xs font-medium">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-[#3B82F6] hover:text-[#8B5CF6] transition-colors font-bold">Log in</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
        }
        @keyframes orbit { from { transform: rotate(0deg) translateY(-100px) translateX(-50%); } to { transform: rotate(360deg) translateY(-100px) translateX(-50%); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
          <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full bg-[rgba(59,130,246,0.15)] blur-3xl pointer-events-none" />
