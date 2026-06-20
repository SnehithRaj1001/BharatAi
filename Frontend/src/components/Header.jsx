import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  // If logged in, we omit "Home" (logo goes home) and group the essential tools.
  // We keep the navbar clean by not shoving every single feature (like Search/Eligibility) into the top bar.
  const navItems = user 
    ? [
        { to: "/dashboard", labelKey: "dashboard" },
        { to: "/schemes", labelKey: "schemes" },
        { to: "/chat", labelKey: "chat" },
        { to: "/profile", labelKey: "profile" },
        { to: "/saved", labelKey: "savedSchemes" },
      ]
    : [
        { to: "/", labelKey: "home" },
        { to: "/schemes", labelKey: "schemes" },
      ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto min-h-[72px] py-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-slate-900 tracking-tight">
            BharatAI
          </Link>
          <p className="text-xs text-slate-500 font-medium tracking-wide hidden sm:block">Govt Scheme Copilot</p>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right: Controls */}
        <div className="flex flex-shrink-0 items-center gap-3 ml-auto">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-700 hover:border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
            aria-label={t("language")}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>

          {user ? (
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition"
            >
              {t("logout")}
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-700 hover:text-slate-900 px-3 py-1.5 text-sm font-semibold transition"
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-indigo-600 px-5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow transition"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
        
      </div>
    </header>
  );
};

export default Header;
