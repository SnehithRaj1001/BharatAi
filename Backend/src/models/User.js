import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  authUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AuthUser",
    required: true,
    unique: true
  },
  // Basic identity
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },           // Male / Female / Transgender / Other
  maritalStatus: { type: String, default: "Single" }, // Single / Married / Widowed / Divorced

  // Location
  state: { type: String, required: true },
  district: { type: String, default: "" },
  residenceType: { type: String, default: "Urban" },  // Urban / Rural / Semi-Urban

  // Education & Occupation
  education: { type: String, required: true },         // No Formal / Primary / Secondary / Higher Secondary / Graduate / Post Graduate
  occupation: { type: String, required: true },
  employmentStatus: { type: String, required: true },  // Employed / Unemployed / Self-Employed / Daily Wage Worker

  // Economic
  annualIncome: { type: Number, required: true },
  bplStatus: { type: String, default: "No" },          // Yes / No — Below Poverty Line
  rationCardType: { type: String, default: "None" },   // None / APL / BPL / Antyodaya / PHH

  // Social category (very important for scheme matching)
  category: { type: String, required: true },          // General / OBC / SC / ST / VJNT / SBC / NT
  religion: { type: String, default: "Not Specified" },
  minority: { type: String, default: "No" },           // Yes / No

  // Special flags (key eligibility criteria)
  studentStatus: { type: String, required: true },       // Yes / No
  farmerStatus: { type: String, required: true },        // Yes / No
  entrepreneurStatus: { type: String, required: true },  // Yes / No
  disabilityStatus: { type: String, default: "No" },     // Yes / No
  disabilityPercentage: { type: Number, default: 0 },    // 0-100
  seniorCitizen: { type: String, default: "No" },        // Yes / No (age >= 60)
  exServiceman: { type: String, default: "No" },         // Yes / No
  constructionWorker: { type: String, default: "No" },   // Yes / No
  landOwnership: { type: String, default: "No" },        // Yes / No (for farmer schemes)
  landSizeAcres: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
export default User;
