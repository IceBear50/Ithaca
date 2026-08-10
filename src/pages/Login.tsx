import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Anchor, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await signIn(email, password);

    if (err) {
      if (err.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(err);
      }
    } else {
      navigate("/onboarding");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ithaca flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <Anchor className="w-10 h-10 text-accent mx-auto mb-4" />
          <h1 className="font-heading text-4xl text-foreground mb-2">Ithaca</h1>
          <p className="text-muted text-sm">Your AI Personal Operating System</p>
        </div>

        {/* Sign In card */}
        <form onSubmit={handleSubmit} className="glass-surface p-8 space-y-5">
          <h2 className="font-heading text-2xl text-foreground text-center">
            Return to Your Journey
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
                placeholder="••••••••"
                required
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
            {loading ? "Signing in..." : "Continue Your Journey"}
          </button>

          <p className="text-center text-sm text-muted">
            New to Ithaca?{" "}
            <Link
              to="/signup"
              className="text-accent hover:text-accent/80 transition-colors underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}