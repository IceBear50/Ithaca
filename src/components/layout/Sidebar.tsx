import { NavLink } from "react-router-dom";
import { Compass, Anchor, Sailboat, Sparkles, Map, GitFork, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/ithaca", label: "Ithaca", icon: Anchor },
  { to: "/voyage", label: "Voyage", icon: Sailboat },
  { to: "/mirror", label: "Mirror", icon: Sparkles },
  { to: "/atlas", label: "Atlas", icon: Map },
  { to: "/forks", label: "Forks", icon: GitFork },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-bg-darker border-r border-border flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
        <Compass className="w-6 h-6 text-accent" />
        <span className="font-heading text-lg text-foreground">Ithaca</span>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-2 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 transition-all duration-150 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}