import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { createUserProfile, getMyProfile } from "../services/api.js";

// ── Option sets ────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const CATEGORIES = [
  "General","OBC (Other Backward Class)","SC (Scheduled Caste)",
  "ST (Scheduled Tribe)","VJNT (Vimukta Jati / Nomadic Tribes)",
  "SBC (Special Backward Class)","NT (Nomadic Tribe)","EWS (Economically Weaker Section)"
];

const RATION_TYPES = [
  "None","APL (Above Poverty Line)","BPL (Below Poverty Line)",
  "Antyodaya Anna Yojana (AAY)","Priority Household (PHH)"
];

const INITIAL = {
  // Step 1 – Personal
  name: "", age: "", gender: "", maritalStatus: "Single",
  // Step 2 – Location
  state: "", district: "", residenceType: "Urban",
  // Step 3 – Education & Work
  education: "", occupation: "", employmentStatus: "Unemployed",
  // Step 4 – Economic
  annualIncome: "", bplStatus: "No", rationCardType: "None",
  // Step 5 – Social Identity
  category: "General", religion: "Not Specified", minority: "No",
  // Step 6 – Special Eligibility Flags
  studentStatus: "No", farmerStatus: "No", entrepreneurStatus: "No",
  disabilityStatus: "No", disabilityPercentage: 0,
  exServiceman: "No", constructionWorker: "No",
  landOwnership: "No", landSizeAcres: 0,
};

const STEPS = [
  { id: 1, title: "Personal Info",       icon: "👤" },
  { id: 2, title: "Location",            icon: "📍" },
  { id: 3, title: "Education & Work",    icon: "🎓" },
  { id: 4, title: "Income",              icon: "💰" },
  { id: 5, title: "Social Identity",     icon: "🏷️" },
  { id: 6, title: "Special Categories", icon: "⭐" },
];

// ── Reusable field components ───────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-slate-700">
      {label}
      {hint && <span className="ml-1 text-xs font-normal text-slate-400">({hint})</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition";

const Select = ({ name, value, onChange, options, placeholder }) => (
  <select name={name} value={value} onChange={onChange} className={inputCls}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) =>
      typeof o === "string" ? (
        <option key={o} value={o}>{o}</option>
      ) : (
        <option key={o.value} value={o.value}>{o.label}</option>
      )
    )}
  </select>
);

const YesNo = ({ name, value, onChange, label }) => (
  <Field label={label}>
    <div className="flex gap-3">
      {["Yes", "No"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange({ target: { name, value: v } })}
          className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
            value === v
              ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300"
          }`}
        >
          {v === "Yes" ? "✓ Yes" : "✗ No"}
        </button>
      ))}
    </div>
  </Field>
);

// ── Step panels ─────────────────────────────────────────────────────────────
const Step1 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <Field label="Full Name">
      <input name="name" type="text" value={form.name} onChange={onChange}
        placeholder="e.g. Ramesh Kumar" className={inputCls} required />
    </Field>
    <Field label="Age" hint="years">
      <input name="age" type="number" value={form.age} onChange={onChange}
        min={1} max={120} placeholder="25" className={inputCls} required />
    </Field>
    <Field label="Gender">
      <Select name="gender" value={form.gender} onChange={onChange}
        placeholder="Select gender"
        options={["Male","Female","Transgender","Other"]} />
    </Field>
    <Field label="Marital Status">
      <Select name="maritalStatus" value={form.maritalStatus} onChange={onChange}
        options={["Single","Married","Widowed","Divorced","Separated"]} />
    </Field>
  </div>
);

const Step2 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <Field label="State / UT">
      <Select name="state" value={form.state} onChange={onChange}
        placeholder="Select state" options={INDIAN_STATES} />
    </Field>
    <Field label="District" hint="optional">
      <input name="district" type="text" value={form.district} onChange={onChange}
        placeholder="e.g. Pune" className={inputCls} />
    </Field>
    <Field label="Area Type" hint="affects scheme eligibility">
      <div className="flex gap-3">
        {["Urban","Rural","Semi-Urban"].map((v) => (
          <button key={v} type="button"
            onClick={() => onChange({ target: { name: "residenceType", value: v } })}
            className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition ${
              form.residenceType === v
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300"
            }`}>
            {v}
          </button>
        ))}
      </div>
    </Field>
  </div>
);

const Step3 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <Field label="Highest Education">
      <Select name="education" value={form.education} onChange={onChange}
        placeholder="Select level"
        options={["No Formal Education","Primary (1–5)","Middle (6–8)",
          "Secondary (10th)","Higher Secondary (12th)","Diploma / ITI",
          "Graduate (B.A/B.Sc/B.Com/B.Tech etc.)","Post Graduate","Doctorate"]} />
    </Field>
    <Field label="Occupation">
      <input name="occupation" type="text" value={form.occupation} onChange={onChange}
        placeholder="e.g. Farmer, Teacher, Business Owner" className={inputCls} required />
    </Field>
    <div className="sm:col-span-2">
      <Field label="Employment Status">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Employed","Unemployed","Self-Employed","Daily Wage Worker"].map((v) => (
            <button key={v} type="button"
              onClick={() => onChange({ target: { name: "employmentStatus", value: v } })}
              className={`rounded-xl border py-2.5 text-xs font-semibold text-center transition ${
                form.employmentStatus === v
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </Field>
    </div>
  </div>
);

const Step4 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <Field label="Annual Household Income" hint="₹ per year">
      <input name="annualIncome" type="number" value={form.annualIncome} onChange={onChange}
        min={0} placeholder="e.g. 150000" className={inputCls} required />
    </Field>
    <Field label="Income Bracket" hint="auto-calculated">
      <div className={`${inputCls} text-slate-500 cursor-default`}>
        {form.annualIncome === "" ? "—" :
          Number(form.annualIncome) <= 100000 ? "< ₹1 Lakh (Very Low)" :
          Number(form.annualIncome) <= 300000 ? "₹1–3 Lakh (Low)" :
          Number(form.annualIncome) <= 600000 ? "₹3–6 Lakh (Middle)" :
          Number(form.annualIncome) <= 1000000 ? "₹6–10 Lakh (Upper Middle)" :
          "> ₹10 Lakh (High)"}
      </div>
    </Field>
    <YesNo name="bplStatus" value={form.bplStatus} onChange={onChange}
      label="Below Poverty Line (BPL) Card Holder?" />
    <Field label="Ration Card Type">
      <Select name="rationCardType" value={form.rationCardType} onChange={onChange}
        options={RATION_TYPES} />
    </Field>
  </div>
);

const Step5 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <Field label="Social Category" hint="critical for scheme matching">
      <Select name="category" value={form.category} onChange={onChange}
        options={CATEGORIES} />
    </Field>
    <Field label="Religion">
      <Select name="religion" value={form.religion} onChange={onChange}
        options={["Not Specified","Hindu","Muslim","Christian","Sikh",
          "Buddhist","Jain","Parsi","Others"]} />
    </Field>
    <YesNo name="minority" value={form.minority} onChange={onChange}
      label="Notified Minority Community?" />
  </div>
);

const Step6 = ({ form, onChange }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <YesNo name="studentStatus" value={form.studentStatus} onChange={onChange} label="Currently a Student?" />
    <YesNo name="farmerStatus" value={form.farmerStatus} onChange={onChange} label="Farmer / Agricultural Worker?" />
    <YesNo name="entrepreneurStatus" value={form.entrepreneurStatus} onChange={onChange} label="Entrepreneur / Self-Employed?" />
    <YesNo name="exServiceman" value={form.exServiceman} onChange={onChange} label="Ex-Serviceman / Defence Personnel?" />
    <YesNo name="constructionWorker" value={form.constructionWorker} onChange={onChange} label="Registered Construction Worker?" />
    <YesNo name="disabilityStatus" value={form.disabilityStatus} onChange={onChange} label="Person with Disability?" />
    {form.disabilityStatus === "Yes" && (
      <Field label="Disability Percentage" hint="0–100%">
        <input name="disabilityPercentage" type="number" value={form.disabilityPercentage}
          onChange={onChange} min={0} max={100} className={inputCls} />
      </Field>
    )}
    <YesNo name="landOwnership" value={form.landOwnership} onChange={onChange} label="Owns Agricultural Land?" />
    {form.landOwnership === "Yes" && (
      <Field label="Land Size" hint="in acres">
        <input name="landSizeAcres" type="number" value={form.landSizeAcres}
          onChange={onChange} min={0} step={0.1} className={inputCls} />
      </Field>
    )}
  </div>
);

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6];

// ── Main Component ───────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) return;
      try {
        const profile = await getMyProfile(authUser.id);
        if (profile && profile.name) {
          // Map short codes back to full labels for the UI
          const mappedCategory = CATEGORIES.find(c => c.startsWith(profile.category)) || profile.category;
          const mappedRation = RATION_TYPES.find(c => c.startsWith(profile.rationCardType)) || profile.rationCardType;
          
          setForm({ ...INITIAL, ...profile, category: mappedCategory, rationCardType: mappedRation });
          setIsExistingProfile(true);
          setIsEditing(false); // Show the read-only view
        } else {
          setIsEditing(true); // No profile found, show form
        }
      } catch (err) {
        setIsEditing(true); // Error fetching, default to form
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const next = () => { setError(null); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        authUserId: authUser.id,
        age: Number(form.age),
        annualIncome: Number(form.annualIncome),
        disabilityPercentage: Number(form.disabilityPercentage),
        landSizeAcres: Number(form.landSizeAcres),
        // Normalise OBC/SC/ST labels down to short codes for the ML model
        category: form.category.split(" ")[0],
        rationCardType: form.rationCardType.split(" ")[0],
      };
      await createUserProfile(payload);
      setIsExistingProfile(true);
      setIsEditing(false); // Switch back to view mode on save
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStep = STEP_COMPONENTS[step];
  const isLast = step === STEPS.length - 1;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!isEditing && isExistingProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 py-10 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{t("profile")}</h1>
            <button onClick={() => setIsEditing(true)} className="rounded-full bg-white border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">
              Edit Profile
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center gap-6">
              <div className="h-20 w-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {form.name ? form.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{form.name}</h2>
                <p className="text-slate-500">{form.age} years • {form.gender} • {form.maritalStatus}</p>
                <p className="text-slate-500 mt-1">{form.district ? `${form.district}, ` : ''}{form.state} ({form.residenceType})</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-slate-100">
              <div className="bg-white p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Education & Occupation</h3>
                <div className="space-y-3">
                  <div><p className="text-sm text-slate-500">Education</p><p className="font-medium text-slate-900">{form.education}</p></div>
                  <div><p className="text-sm text-slate-500">Occupation</p><p className="font-medium text-slate-900">{form.occupation}</p></div>
                  <div><p className="text-sm text-slate-500">Status</p><p className="font-medium text-slate-900">{form.employmentStatus}</p></div>
                </div>
              </div>
              <div className="bg-white p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Economic & Social</h3>
                <div className="space-y-3">
                  <div><p className="text-sm text-slate-500">Annual Income</p><p className="font-medium text-slate-900">₹{form.annualIncome}</p></div>
                  <div><p className="text-sm text-slate-500">Category</p><p className="font-medium text-slate-900">{form.category}</p></div>
                  <div><p className="text-sm text-slate-500">Ration / BPL</p><p className="font-medium text-slate-900">{form.rationCardType} {form.bplStatus === "Yes" ? "(BPL)" : ""}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Special Eligibility Factors</h3>
               <div className="flex flex-wrap gap-2">
                 {form.studentStatus === "Yes" && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Student</span>}
                 {form.farmerStatus === "Yes" && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Farmer</span>}
                 {form.entrepreneurStatus === "Yes" && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Entrepreneur</span>}
                 {form.disabilityStatus === "Yes" && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Disability ({form.disabilityPercentage}%)</span>}
                 {form.exServiceman === "Yes" && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Ex-Serviceman</span>}
                 {form.constructionWorker === "Yes" && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Construction Worker</span>}
                 {form.landOwnership === "Yes" && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Land Owner ({form.landSizeAcres} acres)</span>}
                 {form.minority === "Yes" && <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">Minority Community</span>}
                 {form.religion !== "Not Specified" && <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">{form.religion}</span>}
               </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 py-10 px-4">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{isExistingProfile ? "Edit Profile" : t("profile")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isExistingProfile 
              ? "Update your profile details to refine your scheme recommendations" 
              : "Complete your profile to get personalised government scheme recommendations"}
          </p>
        </div>

        {/* Step progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold border-2 transition-all ${
                    i < step
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : i === step
                      ? "border-indigo-600 bg-white text-indigo-600 shadow-md shadow-indigo-100"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {i < step ? "✓" : s.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute" style={{ display: "none" }} />
                )}
              </div>
            ))}
          </div>
          {/* connector line */}
          <div className="relative h-1.5 rounded-full bg-slate-200 mx-4 -mt-5">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
              Step {step + 1} of {STEPS.length} — {STEPS[step].icon} {STEPS[step].title}
            </span>
          </div>
        </div>

        {/* Card */}
        <form onSubmit={isLast ? handleSubmit : (e) => { e.preventDefault(); next(); }}>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <CurrentStep form={form} onChange={handleChange} />
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Back
            </button>

            <div className="text-xs text-slate-400">{step + 1} / {STEPS.length}</div>

            <button
              type="submit"
              disabled={isSaving}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${
                isLast
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              {isSaving ? "Saving…" : isLast ? (isExistingProfile ? "Save Changes" : "🚀 Get My Recommendations") : "Continue →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProfilePage;
