import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Mail, Lock, Sparkles, Loader2, User, ArrowLeft, KeyRound,
  BookOpen, Brain, Infinity, FileText, CheckCircle2, Zap,
} from "lucide-react";

type Step = "mode" | "name" | "email" | "otp" | "password" | "forgot";
type ForgotStep = "email" | "newpass";

const features = [
  { icon: Brain, title: "AI-Powered Questions", desc: "Fresh, unique problems generated every session — never the same quiz twice." },
  { icon: BookOpen, title: "87 Topics, 11 Domains", desc: "Complete coverage of all Grade 6 NJSLA math standards." },
  { icon: FileText, title: "Printable PDF Worksheets", desc: "Download ready-to-print worksheets with full answer keys and explanations." },
  { icon: Infinity, title: "Unlimited Practice", desc: "No limits on quizzes. Practice as much as you need, whenever you want." },
];

const socialProof = [
  "✅ 100% Free — No credit card needed",
  "✅ Aligned to 2023 NJ Learning Standards",
  "✅ Instant feedback & explanations",
  "✅ Works on any device",
];

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("mode");
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  const handleForgotPassword = async () => {
    if (forgotPassword !== forgotConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (forgotPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }
      toast.success("Password updated! You can now sign in.");
      setStep("mode");
      setForgotEmail("");
      setForgotPassword("");
      setForgotConfirmPassword("");
      setForgotStep("email");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { studentName, email },
      });
      if (data?.error) throw new Error(data.error);
      if (error) throw new Error("Failed to send OTP. Please try again.");
      toast.success("OTP has been sent to the admin for verification.");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, otp },
      });
      if (data?.error) throw new Error(data.error);
      if (error) throw new Error("OTP verification failed. Please try again.");
      toast.success("OTP verified! Now create your password.");
      setStep("password");
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { student_name: studentName },
        },
      });
      if (error) throw error;
      toast.success("Account created! Check your email to verify, then sign in.");
      setStep("mode");
      setStudentName("");
      setEmail("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Account not found or incorrect password", {
            description: "If you don't have an account, please contact rj.yogeshwari@gmail.com to get one created.",
          });
        } else {
          toast.error(error.message || "Login failed");
        }
        return;
      }
      // Check if account is deactivated due to cost limit
      if (data.user) {
        const { data: usage } = await supabase
          .from("user_usage")
          .select("input_tokens, output_tokens")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (usage) {
          const cost = (usage.input_tokens * 0.15 / 1_000_000) + (usage.output_tokens * 0.60 / 1_000_000);
          if (cost >= 10) {
            await supabase.auth.signOut();
            toast.error("Your account has been deactivated due to reaching the $10 usage limit.", {
              description: "Please contact rj.yogeshwari@gmail.com for assistance.",
            });
            return;
          }
        }
      }
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (current: Step) => {
    const steps: Step[] = ["name", "email", "otp", "password"];
    const idx = steps.indexOf(current);
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              i <= idx ? "bg-primary w-8" : "bg-muted w-4"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-display font-bold text-primary">MathPrep</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium"
              onClick={() => {
                setStep("mode");
                const formEl = document.getElementById("auth-form");
                if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Log in
            </Button>
            <Button
              size="sm"
              className="text-sm font-medium"
              onClick={() => {
                setStep("name");
                const formEl = document.getElementById("auth-form");
                if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
      {/* LEFT — Marketing Hero */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-16 lg:py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> AI Powered
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight mb-2 sm:mb-4">
            Master 6th Grade Math
            <br />
            <span className="text-primary">the Smart Way</span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground mb-4 sm:mb-8 max-w-lg">
            The #1 AI-powered practice platform for NJSLA Grade 6 Mathematics. 
            Fresh questions every session, printable worksheets, and instant feedback — all completely free.
          </p>

          {/* Feature grid - hidden on mobile to save space */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-4 mb-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof - compact on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden sm:block space-y-1.5"
          >
            {socialProof.map((item) => (
              <p key={item} className="text-sm text-muted-foreground">{item}</p>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT — Auth Form */}
      <div id="auth-form" className="lg:w-1/2 flex items-center justify-center px-4 py-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-1 tracking-tight font-display">NJSLA 6th Grade</h2>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-3 mx-auto">
                <Sparkles className="w-4 h-4" /> AI Powered
              </div>

              {step === "mode" && (
                <>
                  <CardTitle className="text-xl font-display">Get Started</CardTitle>
                  <CardDescription>Sign in or create a free account</CardDescription>
                </>
              )}
              {step === "name" && (
                <>
                  {stepIndicator("name")}
                  <CardTitle className="text-xl font-display">What's your name?</CardTitle>
                  <CardDescription>Enter your full name to get started</CardDescription>
                </>
              )}
              {step === "email" && (
                <>
                  {stepIndicator("email")}
                  <CardTitle className="text-xl font-display">Your Email</CardTitle>
                  <CardDescription>We'll use this for your account</CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    A 6-digit verification code will be sent to rj.yogeshwari@gmail.com for approval.
                  </p>
                </>
              )}
              {step === "otp" && (
                <>
                  {stepIndicator("otp")}
                  <CardTitle className="text-xl font-display">Enter OTP</CardTitle>
                  <CardDescription>Ask your teacher for the 6-digit verification code</CardDescription>
                </>
              )}
              {step === "forgot" && (
                <>
                  <CardTitle className="text-xl font-display">Reset Password</CardTitle>
                  <CardDescription>Enter your email to reset your password</CardDescription>
                </>
              )}
              {step === "password" && (
                <>
                  {stepIndicator("password")}
                  <CardTitle className="text-xl font-display">Create Password</CardTitle>
                  <CardDescription>Choose a secure password for your account</CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {/* MODE SELECT */}
              {step === "mode" && (
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-9"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sign In
                    </Button>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline w-full text-center"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setStep("forgot");
                      }}
                    >
                      Forgot Password?
                    </button>
                  </form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setStep("name")}>
                    Create Free Account
                  </Button>
                </div>
              )}

              {/* STEP 1: NAME */}
              {step === "name" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-name"
                        placeholder="Enter your full name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!studentName.trim()} onClick={() => setStep("email")}>
                    Continue
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep("mode")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                  </Button>
                </div>
              )}

              {/* STEP 2: EMAIL */}
              {step === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!email.trim() || loading} onClick={handleSendOtp}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send OTP
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep("name")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>
              )}

              {/* STEP 3: OTP */}
              {step === "otp" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button className="w-full" disabled={otp.length !== 6 || loading} onClick={handleVerifyOtp}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <KeyRound className="w-4 h-4 mr-2" /> Verify OTP
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>
              )}

              {/* STEP 4: PASSWORD */}
              {step === "password" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                        minLength={6}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!password || !confirmPassword || loading}
                    onClick={handleCreateAccount}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Account
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep("otp")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>
              )}

              {/* FORGOT PASSWORD */}
              {step === "forgot" && forgotStep === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!forgotEmail.trim()} onClick={() => setForgotStep("newpass")}>
                    Continue
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => { setStep("mode"); setForgotStep("email"); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                  </Button>
                </div>
              )}
              {step === "forgot" && forgotStep === "newpass" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-new-pw">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-new-pw"
                        type="password"
                        placeholder="••••••••"
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        className="pl-9"
                        minLength={6}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-confirm-pw">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-confirm-pw"
                        type="password"
                        placeholder="••••••••"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="pl-9"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!forgotPassword || !forgotConfirmPassword || loading}
                    onClick={handleForgotPassword}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Reset Password
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setForgotStep("email")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing up you agree to practice math every day 🎯
          </p>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            For any support or facing challenges pls email to rj.yogeshwari@gmail.com
          </p>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
