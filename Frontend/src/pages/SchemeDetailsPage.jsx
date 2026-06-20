import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getSchemeById } from "../services/api.js";
import { saveScheme, removeSavedScheme, getSavedSchemes } from "../services/dashboardApi.js";

const SchemeDetailsPage = () => {
  const { t } = useLanguage();
  const { schemeId } = useParams();
  const { user } = useAuth();
  
  const [scheme, setScheme] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadScheme = async () => {
      setLoading(true);
      try {
        const data = await getSchemeById(schemeId);
        setScheme(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    void loadScheme();
  }, [schemeId]);

  useEffect(() => {
    if (user) {
      getSavedSchemes()
        .then(data => {
          setIsSaved(data.some(s => s._id === schemeId));
        })
        .catch(console.error);
    }
  }, [user, schemeId]);

  const toggleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (isSaved) {
        await removeSavedScheme(schemeId);
        setIsSaved(false);
      } else {
        await saveScheme(schemeId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle save state:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-red-600">
        {error}
      </div>
    );
  }

  if (!scheme) {
    return null;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <Link
              to="/schemes"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← {t("backToSchemes")}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">
              {scheme.schemeName}
            </h1>
          </div>
          
          {user && (
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors border ${
                isSaved 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" 
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <svg className={`w-5 h-5 ${isSaved ? 'fill-current text-indigo-600' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isSaved ? "Saved" : "Save Scheme"}
            </button>
          )}
        </div>
        
        <p className="mt-3 text-slate-600">{scheme.description}</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">{t("benefits")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {scheme.benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">{t("eligibility")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {scheme.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">
              {t("requiredDocuments")}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {scheme.requiredDocuments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">
              {t("applicationProcess")}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {scheme.applicationProcess.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 items-center">
          <a
            href={scheme.officialLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t("officialLink")}
          </a>
          
          {user && (
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`sm:hidden inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors border ${
                isSaved 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" 
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <svg className={`w-5 h-5 ${isSaved ? 'fill-current text-indigo-600' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isSaved ? "Saved" : "Save Scheme"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default SchemeDetailsPage;
