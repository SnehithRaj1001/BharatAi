import User from "../models/User.js";

export const createUserProfile = async (req, res) => {
  const profileData = req.body;
  const requiredFields = [
    "authUserId", "name", "age", "gender", "state", "education",
    "occupation", "annualIncome", "category",
    "studentStatus", "farmerStatus", "entrepreneurStatus", "employmentStatus",
  ];

  for (const field of requiredFields) {
    if (profileData[field] === undefined || profileData[field] === null || profileData[field] === "") {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  // Auto-derive senior citizen status from age
  if (Number(profileData.age) >= 60) {
    profileData.seniorCitizen = "Yes";
  }

  // Upsert the profile: if one exists for this authUserId, update it, otherwise create
  const user = await User.findOneAndUpdate(
    { authUserId: profileData.authUserId },
    profileData,
    { new: true, upsert: true }
  );
  res.status(201).json(user);
};

export const getMyProfile = async (req, res) => {
  const { authUserId } = req.query;
  if (!authUserId) return res.status(400).json({ message: "authUserId required" });

  const user = await User.findOne({ authUserId });
  if (!user) {
    return res.status(404).json({ message: "User profile not found" });
  }
  res.json(user);
};

export const getUserProfile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
};

export const listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
};
