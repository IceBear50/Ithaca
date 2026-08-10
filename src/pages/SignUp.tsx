import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Anchor } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: err } = await signUp(email, password);

    if (err) {
      if (err.includes("User already registered")) {
        setError("An account with this email already exists. Sign in instead.");
      } else {
        setError(err);
      }
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ithaca flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-surface p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <Anchor className="w-7 h-7 text-accent" />
            </div>
            <h2 className="font-heading text-2xl text-foreground">
              Almost there!
            </h2>
            <p className="text-muted text-sm">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              Check your inbox and click the link to activate your account.
            </p>
            <p className="text-muted text-xs">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-accent mt-4 w-full text-center cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ithaca flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <Anchor className="w-10 h-10 text-accent mx-auto mb-4" />
          <h1 className="font-heading text-4xl text-foreground mb-2">Ithaca</h1>
          <p className="text-muted text-sm">Your AI Personal Operating System</p>
        </div>

        {/* Sign Up card */}
        <form onSubmit={handleSubmit} className="glass-surface p-8 space-y-5">
          <h2 className="font-heading text-2xl text-foreground text-center">
            Begin Your Journey
          </h2>

          <div>
            <label htmlFor="email" className="block text-sm text-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-bg-darker border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full bg-bg-darker border border-border rounded-lg px-4 py-2.5 pr-10 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-muted mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={6}
              className="w-full bg-bg-darker border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center bg-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full text-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating your account..." : "Set Sail"}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-accent/80 transition-colors underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}