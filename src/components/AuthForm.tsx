import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const headingFont = "font-extrabold text-3xl md:text-4xl tracking-tight text-blue-700";
const subFont = "text-base text-muted-foreground";
const cardBg = "bg-white/95 shadow-xl rounded-2xl border-0";
const accentBtn = "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600";
const accentLink = "text-blue-600 hover:text-green-600 font-semibold underline transition-colors";

type AuthMode = "login" | "signup";

const AuthForm = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signed in successfully!",
            description: `Welcome back!`,
            variant: "default",
          });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created successfully!",
            description: `You can now log in with your credentials.`,
            variant: "default",
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Authentication Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <Card className={"w-full max-w-md p-0 " + cardBg}>
        <CardHeader className="text-center pb-0 pt-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mb-2 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="12" fill="url(#paint0_linear_1_2)"/>
                <path d="M12 17c3.314 0 6-2.686 6-6 0-3.314-2.686-6-6-6s-6 2.686-6 6c0 3.314 2.686 6 6 6zm0-10c2.206 0 4 1.794 4 4 0 2.206-1.794 4-4 4s-4-1.794-4-4c0-2.206 1.794-4 4-4z" fill="#fff"/>
                <defs>
                  <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6"/>
                    <stop offset="1" stopColor="#22C55E"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <CardTitle className={headingFont}>
              {mode === "login" ? "Welcome Back!" : "Create an Account"}
            </CardTitle>
            <CardDescription className={subFont}>
              {mode === "login"
                ? "Sign in to access your medication dashboard."
                : "Sign up to start managing your medications."}
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <CardContent className="space-y-6 pt-6 pb-2">
            <div>
              <Label htmlFor="email" className="mb-1 block text-left text-blue-700 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className="bg-blue-50/60 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-base"
              />
            </div>
            <div className="relative">
              <Label htmlFor="password" className="mb-1 block text-left text-blue-700 font-semibold">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="bg-blue-50/60 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-base pr-12"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-9 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
            <Button type="submit" className={`w-full h-12 rounded-lg text-lg shadow-md ${accentBtn}`} disabled={loading}>
              {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={accentLink}
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={accentLink}
                  >
                    Login
                  </button>
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthForm;
