import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LandingPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-12 shadow-sm relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center relative z-10">
          {/* Left Column: Copy & CTAs */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-indigo-600 mb-3">
              AI-Powered Scheme Matching
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t("welcomeTitle")}
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-lg">
              {t("welcomeDescription")}
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors"
              >
                {t("getStarted")}
              </Link>
              {user ? (
                <Link
                  to="/chat"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Talk to AI
                </Link>
              ) : (
                <Link
                  to="/schemes"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Browse Schemes
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Schemes Preview */}
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              {t("recommendedSchemes")}
            </h2>
            <ul className="space-y-4">
              <li className="rounded-2xl bg-slate-50 hover:bg-indigo-50/50 transition-colors p-5 border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">PM Kisan Samman Nidhi</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Farmer income support scheme for small and marginal farmers.
                </p>
              </li>
              <li className="rounded-2xl bg-slate-50 hover:bg-indigo-50/50 transition-colors p-5 border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">PM Kaushal Vikas Yojana</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Training and certification support for eligible youth to enhance employability.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
