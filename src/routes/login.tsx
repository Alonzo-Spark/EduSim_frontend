import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
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
  const CLEAR_LOGIN_SEARCH = { verify_token: undefined, reset_token: undefined };
  
  const { 
    login, 
    register,
    sendOtp, 
    verifyOtp, 
    forgotPassword, 
    resetPassword, 
    verifyEmail,
    isLoading 
  } = (useAuthStore as any)();

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
          navigate({ to: "/login", replace: true, search: CLEAR_LOGIN_SEARCH });
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.warning("Please enter your email and password");
      return;
    }
    const success = await login({ email: normalizedEmail, password });
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.warning("Please enter your email address");
      return;
    }
    const success = await forgotPassword(normalizedEmail);
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
      navigate({ to: "/login", replace: true, search: CLEAR_LOGIN_SEARCH });
    }
  };

  // Simulated Google Auth click
  const handleGoogleLogin = async () => {
    toast.info("Simulating Google OAuth connection...");
    await new Promise(resolve => setTimeout(resolve, 1200));

    const demoAccount = {
      name: "Demo Student",
      email: "student@edusim.local",
      password: "Password123!",
    };

    let success = await login({ email: demoAccount.email, password: demoAccount.password });

    if (!success) {
      const registered = await register({
        name: demoAccount.name,
        email: demoAccount.email,
        password: demoAccount.password,
      });

      if (registered) {
        success = await login({ email: demoAccount.email, password: demoAccount.password });
      }
    }

    if (success) {
      toast.success("Welcome back! Signed in with Google.");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background text-foreground font-sans">
      {/* Soft Ambient Background Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#FAFCFF] via-[#F4F9FF] to-[#E6F2FF]" />

      <div className="relative z-10 grid min-h-[100svh] w-full max-w-[1100px] grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 py-8 mx-auto">
        
        {/* Left Hero Panel */}
        <div className="hidden lg:flex flex-col justify-center gap-8 h-full">
          <Link to="/" className="flex items-center gap-2.5 group relative z-10 w-fit">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm hover:rotate-12 transition-transform duration-300">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wider font-mono text-foreground">
              Edu<span className="text-primary">Sim</span>
            </span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border/40 text-[10px] text-primary font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-primary" /> Next Generation Learning
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Explore Science Through <br />
              <span className="text-primary">Immersive Simulations</span>
            </h1>

            <p className="text-muted-foreground text-[13px] leading-relaxed max-w-lg">
              Step into a new era of interactive learning with AI tutors, smart simulations, and powerful formula labs.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "AI-Powered Tutor", desc: "Get instant answers and explanations", icon: Brain, color: "#70B5FF" },
              { label: "Interactive Simulations", desc: "High-fidelity physics engine", icon: Play, color: "#70B5FF" },
              { label: "Formula Lab Explorer", desc: "Track variables and master formulas", icon: Atom, color: "#70B5FF" },
              { label: "Progress Tracking", desc: "Detailed mastery dashboards", icon: TrendingUp, color: "#70B5FF" },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/60 hover:bg-secondary/40 transition-all duration-300 cursor-pointer shadow-sm"
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
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                        {f.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="w-full max-w-[420px] mx-auto rounded-[24px] p-8 md:p-10 border border-border shadow-[0_8px_30px_rgba(112,181,255,0.06)] relative bg-card overflow-hidden group">
            {reset_token ? (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">New Password</h3>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">NEW PASSWORD</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none placeholder:text-muted-foreground/60" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none placeholder:text-muted-foreground/60" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 duration-200">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Password"}
                  </button>
                </form>
              </div>
            ) : showForgotForm ? (
              <div>
                <button onClick={() => setShowForgotForm(false)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                <div className="mb-6"><h3 className="text-2xl font-black text-foreground">Reset Password</h3></div>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground font-mono">EMAIL</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none placeholder:text-muted-foreground/60" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 duration-200">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Reset Link"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground">Access EduSim</h3>
                  <p className="text-xs text-muted-foreground">Sign in to continue your learning journey</p>
                </div>
                <button onClick={handleGoogleLogin} className="w-full py-3.5 rounded-2xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-3 hover:bg-secondary transition-all hover:scale-[1.01] active:scale-[0.99] duration-200">
                  <Chrome className="w-4 h-4 text-primary" /> Continue with Google
                </button>
                <div className="flex items-center gap-3"><div className="flex-1 h-[1px] bg-border" /><span className="text-[10px] text-muted-foreground font-mono">OR</span><div className="flex-1 h-[1px] bg-border" /></div>
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-secondary border border-border/40">
                  <button onClick={() => { setActiveTab("email"); setOtpSent(false); }} className={`py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === "email" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}>Email</button>
                  <button onClick={() => setActiveTab("otp")} className={`py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === "otp" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}>OTP</button>
                </div>
                {activeTab === "email" ? (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none placeholder:text-muted-foreground/60" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none placeholder:text-muted-foreground/60" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <label className="flex items-center gap-2 text-muted-foreground select-none cursor-pointer">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary" />
                        Remember me
                      </label>
                      <button type="button" onClick={() => setShowForgotForm(true)} className="text-primary hover:underline transition-colors font-medium">Forgot password?</button>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 duration-200">{isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sign In"}</button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="flex gap-2">
                          <input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-16 text-center rounded-2xl bg-background border border-border text-sm text-foreground outline-none" />
                          <div className="relative flex-1">
                            <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                            <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
                          </div>
                        </div>
                        <button type="submit" className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 duration-200">Send OTP</button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center gap-2">
                          {otpCode.map((data, index) => <input key={index} maxLength={1} ref={(el) => { if (el) otpInputs.current[index] = el; }} value={data} onChange={(e) => handleOtpChange(e.target, index)} className="w-11 h-12 text-center rounded-xl bg-background border border-border text-lg font-bold text-foreground outline-none focus:border-primary" />)}
                        </div>
                        <button onClick={handleResendOtp} disabled={countdown > 0} className="text-xs text-primary disabled:text-muted-foreground">Resend Code ({countdown}s)</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center pt-2 text-xs font-medium">
                  <span className="text-muted-foreground">New to EduSim? </span>
                  <Link to="/signup" className="text-primary hover:underline transition-colors font-bold">
                    Create an account
                  </Link>
                </div>
              </div>
            )}
          
        </div>
      </div>


      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
