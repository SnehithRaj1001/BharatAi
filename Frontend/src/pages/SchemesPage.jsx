import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getAllSchemes } from "../services/api.js";

const SchemesPage = () => {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllSchemes();
        setSchemes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    void fetchSchemes();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          {t("schemes")}
        </h1>

        {loading && <p className="text-slate-600">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-5">
          {schemes.map((scheme) => (
            <article
              key={scheme._id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {scheme.schemeName}
                  </h2>
                  <p className="mt-2 text-slate-600 line-clamp-2">{scheme.description}</p>
                </div>
                <Link
                  to={`/schemes/${scheme._id}`}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {t("schemeDetails")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default SchemesPage;
