const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

const getAuthToken = () => window.localStorage.getItem("bharatai-token") || "";

const request = async (path, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Server error");
  }

  return payload;
};

export { request };

export const getMyProfile = (authUserId) =>
  request(`/users/me?authUserId=${authUserId}`);

export const createUserProfile = (profileData) =>
  request("/users", {
    method: "POST",
    body: JSON.stringify(profileData),
  });

export const getRecommendationsByUser = (userId) =>
  request(`/recommendations/user/${userId}`);
export const createRecommendations = (userId) =>
  request("/recommendations", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
export const getSmartRecommendations = (userId) =>
  request("/recommendations/smart", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
export const getSchemeById = (schemeId) => request(`/schemes/${schemeId}`);
export const getAllSchemes = () => request("/schemes");
export const sendChatMessage = (payload) =>
  request("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const getChatHistory = (userId) => request(`/chat/${userId}`);
export const loginUser = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
export const registerUser = (credentials) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
