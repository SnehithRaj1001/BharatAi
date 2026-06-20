import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getMyProfile,
  getSmartRecommendations,
} from "../services/api.js";
import { getSavedSchemes } from "../services/dashboardApi.js";

// Badge colours for eligibility
const EligibilityBadge = ({ isEligible }) =>
  isEligible ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      ✓ Eligible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
      ✗ Not Eligible
    </span>
  );

// Card for a single AI-assessed scheme
const SmartSchemeCard = ({ mlMatch, llmInfo }) => {
  const [expanded, setExpanded] = useState(false);
  const score = Math.round((mlMatch.match_score || 0) * 100);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 leading-snug">
          {mlMatch.schemeName}
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {llmInfo && <EligibilityBadge isEligible={llmInfo.isEligible} />}
          <span
            className="rounded-full px-4 py-1 text-sm font-bold"
            style={{
              background: score >= 70 ? "#dcfce7" : score >= 40 ? "#fef9c3" : "#fee2e2",
              color: score >= 70 ? "#15803d" : score >= 40 ? "#a16207" : "#b91c1c",
            }}
          >
            {score}% Match
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-3">
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
          {mlMatch.description}
        </p>

        {mlMatch.category && (
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
            {mlMatch.category}
          </span>
        )}

        {llmInfo?.reasoning && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">🤖 AI Analysis: </span>
            {llmInfo.reasoning}
          </div>
        )}

        {llmInfo?.missingRequirements?.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠ Missing Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {llmInfo.missingRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {mlMatch.benefits?.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              {expanded ? "▲ Hide benefits" : "▼ Show benefits"}
            </button>
            {expanded && (
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                {mlMatch.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 flex items-center gap-3">
        {mlMatch.officialLink && mlMatch.officialLink !== "#" && (
          <a
            href={mlMatch.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Apply Now ↗
          </a>
        )}
      </div>
    </article>
  );
};

const DashboardPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [smartData, setSmartData] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);

  const [savedSchemes, setSavedSchemes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const p = await getMyProfile(user.id);
        setProfile(p);
      } catch (err) {
        // 404 is fine (no profile yet)
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Fetch Recs & Saved Schemes if Profile exists
  useEffect(() => {
    if (!profile) return;

    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const result = await getSmartRecommendations(profile._id);
        setSmartData(result.data || result);
      } catch (err) {
        setRecsError(err.message);
      } finally {
        setLoadingRecs(false);
      }
    };

    const loadSaved = async () => {
      setLoadingSaved(true);
      try {
        const schemes = await getSavedSchemes();
        setSavedSchemes(schemes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadRecs();
    loadSaved();
  }, [profile]);

  const mergedSmartResults = () => {
    if (!smartData) return [];
    const mlMatches = smartData.top_ml_matches || [];
    let llmEval = smartData.llm_evaluation || [];
    if (!Array.isArray(llmEval) && llmEval.schemes) llmEval = llmEval.schemes;
    if (!Array.isArray(llmEval)) llmEval = [];

    return mlMatches.map((ml) => ({
      mlMatch: ml,
      llmInfo: llmEval.find(
        (l) => l.schemeName?.toLowerCase() === ml.schemeName?.toLowerCase()
      ) || null,
    }));
  };

  if (loadingProfile) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  // State: No Profile
  if (!profile) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to your Dashboard</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
          To get started, we need to know a little bit about you. Complete your profile to discover government schemes tailored exactly to your eligibility.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="rounded-full bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Complete Your Profile →
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile.name}!</h1>
        <p className="mt-2 text-slate-600">Here are your personalised recommendations and saved schemes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: AI Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              🤖 Top AI Smart Matches
            </h2>
          </div>

          {loadingRecs && (
            <div className="py-10 text-center text-slate-500">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analysing thousands of schemes…
            </div>
          )}

          {recsError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-red-700 text-sm">
              <p className="font-bold mb-1">Could not load recommendations</p>
              <p>{recsError}</p>
            </div>
          )}

          {!loadingRecs && !recsError && mergedSmartResults().length === 0 && (
            <div className="py-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
              No matching schemes found right now. Check back later!
            </div>
          )}

          {!loadingRecs && !recsError && (
            <div className="space-y-6">
              {mergedSmartResults().map((item, idx) => (
                <SmartSchemeCard key={idx} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Saved Schemes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              📌 Saved Schemes
            </h2>
          </div>

          {loadingSaved ? (
            <div className="py-5 text-center text-slate-500 text-sm">Loading saved schemes…</div>
          ) : savedSchemes.length === 0 ? (
            <div className="py-8 px-6 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              You haven't saved any schemes yet.
            </div>
          ) : (
            <div className="space-y-4">
              {savedSchemes.map((scheme) => (
                <Link
                  key={scheme._id}
                  to={`/schemes/${scheme._id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <h3 className="font-semibold text-slate-900 leading-snug">{scheme.schemeName}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{scheme.description}</p>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Links Card */}
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 mt-8">
            <h3 className="font-bold text-indigo-900 mb-2">Need to update your profile?</h3>
            <p className="text-sm text-indigo-700 mb-4">
              If your income, education, or status has changed, update your profile to get fresh recommendations.
            </p>
            <Link
              to="/profile"
              className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition"
            >
              Edit Profile
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
};

export default DashboardPage;
