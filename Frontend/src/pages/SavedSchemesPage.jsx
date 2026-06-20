import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getSavedSchemes } from "../services/dashboardApi.js";
const SavedSchemesPage = () => {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSavedSchemes();
        setSchemes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          {t("savedSchemes")}
        </h1>
        {loading && <p className="text-slate-600">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && schemes.length === 0 && (
          <p className="text-slate-600">{t("emptySavedSchemes")}</p>
        )}
        <div className="space-y-5 mt-6">
          {schemes.map((scheme) => (
            <article
              key={scheme._id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <div className="flex-1">
                <Link to={`/schemes/${scheme._id}`} className="hover:underline">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {scheme.schemeName}
                  </h2>
                </Link>
                <p className="mt-2 text-slate-600 line-clamp-2">{scheme.description}</p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to={`/schemes/${scheme._id}`}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default SavedSchemesPage;
