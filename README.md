# BharatAI 🇮🇳

**AI-Powered Digital Welfare Copilot for India**

> **Description:** BharatAI matches Indian citizens to local and national government welfare schemes using intelligent TF-IDF profile vectorization and Large Language Model (LLM) verification layers. Designed to bridge the information gap in welfare distribution.
> 
> **Topics:** `react`, `vite`, `nodejs`, `express`, `mongodb`, `python`, `tfidf`, `llm`, `gemma`, `openrouter`, `govtech`, `welfare-schemes`, `hackathon`

---

## 📸 Hero Preview

![BharatAI Hero Dashboard](https://placehold.co/1200x600/1e293b/ffffff?text=BharatAI+Digital+Welfare+Copilot+Dashboard)
*Figure 1: Citizen dashboard displaying matched schemes, eligibility check visualizations, and the AI welfare copilot.*

---

## 🚀 Key Features

This prototype is a working version of BharatAI built for a hackathon demo. It includes:

- User authentication and protected routes
- User profile collection for Indian citizens (Read-only Dashboard + Edit Wizard)
- Personalized scheme recommendations powered by TF-IDF and LLMs (`google/gemma-4-31b-it:free` via OpenRouter)
- Ability to bookmark and save schemes to a dedicated "Saved Schemes" dashboard
- Missed-benefits insights and comparison features
- Scheme details pages with benefits, eligibility, documents, and application process
- Fully functional Multi-turn AI assistant with a WhatsApp-style UI and markdown rendering
- English / Hindi language support via translation keys
- Responsive, modern Tailwind UI with glassmorphism and intelligent routing

## End-to-end status

- Backend is running successfully on `http://localhost:5002`
- Backend health endpoint responds at `GET /api/health`
- Frontend builds successfully with `npm run build`
- Login and registration UI are implemented and wired to backend auth endpoints
- Auth state is stored locally and protected routes guard key pages
- Profile submission, recommendations, saved schemes, comparison, and eligibility visualization are available
- Port conflict was resolved by using backend port `5002` instead of `5000`

## Current application capabilities

### Frontend

- React + Vite application
- Tailwind CSS responsive styling
- React Router navigation across authenticated and public pages
- Pages included:
  - Landing Page
  - Login Page
  - Register Page
  - Dashboard
  - Profile Page
  - Recommendations Page
  - Schemes List Page
  - Scheme Details Page
  - Saved Schemes Page
  - Scheme Comparison Page
  - Missed Benefits Page
  - Eligibility Visualization Page
  - AI Assistant Page
- Language switcher for English and Hindi labels
- Profile form collects:
  - name
  - age
  - gender
  - state
  - education
  - occupation
  - annualIncome
  - category
  - studentStatus
  - farmerStatus
  - entrepreneurStatus
  - employmentStatus
- Login/register flows save token and user locally
- Protected routes prevent access until authenticated
- Recommendations display scheme cards and saved schemes

### Backend

- Node.js + Express API server
- MongoDB Atlas integration via Mongoose
- Collections:
  - `users`
  - `schemes`
  - `recommendations`
  - `conversations`
  - `authusers`
- API modules included:
  - Auth (`/api/auth`)
  - User (`/api/users`)
  - Scheme (`/api/schemes`)
  - Recommendation (`/api/recommendations`)
  - Chat (`/api/chat`)
  - Saved Schemes (`/api/saved-schemes`)
- Seeded demo schemes are inserted automatically on first run
- Advanced Python-based recommendation engine (`python_scripts/recommendation_service.py`) — a FastAPI microservice spawned automatically by the Node.js server on startup (port `5003`). Uses TF-IDF cosine similarity with an LLM verification layer via OpenRouter.

## AI Implementation

The AI capabilities in BharatAI are powered by a multi-stage pipeline running inside a **Python FastAPI microservice** (`Backend/python_scripts/recommendation_service.py`). This service is automatically spawned by the Node.js server at startup on port `5003` and exposes three endpoints:

- **`POST /recommend`** — Full pipeline: fetch schemes → pre-filter → TF-IDF scoring → LLM evaluation
- **`POST /simplify`** — On-demand plain-language summary of a scheme (triggered by a UI button click)
- **`POST /evaluate-eligibility`** — On-demand per-scheme eligibility check for a specific user (triggered by a UI button click)

### Pipeline Stages

1. **Profile Vectorization (`build_user_query`)**:
   - Converts the citizen's structured profile (age, gender, state, caste category, income, BPL status, occupation, disability, farmer/student/entrepreneur flags, etc.) into a rich, natural-language query string optimized for TF-IDF matching.

2. **Pre-filtering (`pre_filter_schemes`)**:
   - Hard-filters the scheme database before vectorization to remove obviously irrelevant schemes (e.g., women-only schemes for male users, farmer schemes for non-farmers, SC/ST schemes for general-category applicants). Reduces noise and improves precision.

3. **TF-IDF Cosine Similarity Scoring**:
   - Uses `TfidfVectorizer` (bigrams, `sublinear_tf=True`) to vectorize the scheme corpus (name + category + description + eligibility + benefits + required documents) and the user query together.
   - Computes cosine similarity scores between the user vector and every scheme vector.

4. **Score Boosting**:
   - Applies context-aware multipliers to raw scores: +30% for gender-specific schemes matching female/transgender users, +25% for caste category match, +20% for BPL/EWS income brackets, +20% for disability/farmer schemes when applicable, and +15% for ITI/diploma-specific schemes.

5. **Score Normalization & Top-N Selection**:
   - Normalizes all scores to a human-readable 0.45–0.92 range. Selects the **top 5** schemes by raw score for LLM verification.

6. **LLM Verification & Reasoning (`llm_evaluate`)**:
   - Sends the top 5 matched schemes alongside the user profile to an LLM via OpenRouter in a **single batched prompt** (to minimize API calls).
   - Returns structured JSON per scheme: `isEligible`, `reasoning` (plain English or Hindi in Devanagari script), and `missingRequirements`.
   - Model used: **`google/gemma-4-31b-it:free`** (primary), with automatic fallback to `openrouter/free` and `openrouter/auto`.
   - API key is loaded securely from the `OPENROUTER_API_KEY` environment variable via `python-dotenv` — **no hardcoded keys**.

7. **Multi-turn AI Chat Assistant**:
   - A separate chat pipeline (via `Backend/src/routes/chatRoutes.js`) provides a multi-turn WhatsApp-style assistant.
   - Maintains conversation history per user and uses the same OpenRouter LLM to answer questions about schemes, application processes, and required documents in real time, in English or Hindi.

## Folder structure

### Root

- `Backend/`
- `Frontend/`
- `README.md`

### Backend

- `src/config/` - database config
- `src/controllers/` - route handlers
- `src/models/` - Mongoose schema definitions
- `src/routes/` - Express routers
- `src/services/` - helpers like scheme seeding
- `src/utils/` - shared helpers (OpenRouter client, etc.)
- `src/index.js` - server entrypoint (also spawns the Python microservice on startup)
- `python_scripts/recommendation_service.py` - FastAPI AI microservice (TF-IDF + LLM pipeline)

### Frontend

- `src/components/` - reusable UI components
- `src/context/` - language support context
- `src/hooks/` - helper hooks
- `src/pages/` - route pages
- `src/routes/` - app router
- `src/services/` - API client

## How to run locally

### Backend

1. Open terminal in `Backend/`
2. Create `.env` with:
   ```env
   MONGODB_URI="<your atlas connection string>"
   OPENROUTER_API_KEY="<your openrouter api key>"
   ```
3. Install Node.js dependencies:
   ```bash
   npm install
   ```
4. Install Python dependencies for the AI microservice:
   ```bash
   pip install fastapi uvicorn scikit-learn pandas pymongo openai python-dotenv
   ```
5. Start backend:
   ```bash
   npm run dev
   ```
6. The Node.js server starts on `http://localhost:5002` and automatically spawns the Python FastAPI microservice on `http://localhost:5003`.

### Files and folders that should not be committed

- `atlas-credentials.env`
- `Backend/.env`
- `Frontend/.env`
- `Backend/node_modules/`
- `Frontend/node_modules/`
- `Backend/dist/` or any build output
- `Frontend/dist/` or any build output
- `.vscode/` local editor settings
- OS temp files like `.DS_Store`, `Thumbs.db`
- log files like `npm-debug.log*`, `yarn-debug.log*`, `pnpm-debug.log*`

> A root `.gitignore` has been added to exclude these files and folders from GitHub.

### Frontend

1. Open terminal in `Frontend/`
2. Install dependencies if needed:
   ```bash
   npm install
   ```
3. Start frontend:
   ```bash
   npm run dev
   ```
4. Frontend will run on `http://localhost:5173`

## API routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### User

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`

### Scheme

- `GET /api/schemes`
- `GET /api/schemes/:id`

### Recommendation

- `POST /api/recommendations` (body: `{ userId }`)
- `GET /api/recommendations/user/:userId`

### Saved Schemes

- `GET /api/saved-schemes`
- `POST /api/saved-schemes`
- `DELETE /api/saved-schemes/:schemeId`

### Chat

- `POST /api/chat`
- `GET /api/chat/:userId`

### Health

- `GET /api/health`

## Notes

- Backend is verified to run on port `5002` and respond at `/api/health`
- Frontend build completed successfully with `npm run build`
- Auth flows are connected through local token storage and protected routes
- Language support is implemented in `src/context/LanguageContext.jsx`

## Remaining work

- Add production-ready validation and error handling across forms
- Expand the seeded database with more central and state schemes
- Improve mobile responsiveness for complex data tables
- Add deployment-ready configuration and environment docs

## ⏱️ 60-Second Demo Flow

Follow these simple steps to witness the core features of BharatAI:

1. **User Sign-Up & Log-in (10s)**: Register a new citizen account and log in.
2. **Citizen Profile Construction (15s)**: Navigate to the **Profile** wizard. Enter matching parameters: `State: Maharashtra`, `Occupation: Farmer`, `Annual Income: 50,000`, `Category: SC`, `Gender: Male`. Submit the wizard.
3. **Personalized Scheme Matching (15s)**: Instantly receive a prioritized list of schemes (e.g., *PM-Kisan*). Hover/click the scheme to see clear AI reasoning on why you matched or missed.
4. **Compare Schemes (10s)**: Bookmark 2-3 matched schemes and navigate to the **Saved Schemes** page. Use the side-by-side **Comparison Matrix** to compare benefit amounts and criteria.
5. **Interactive Copilot Chat (10s)**: Head to the **AI Assistant** tab. Ask: *"What documents are needed to apply for the PM-Kisan scheme?"*. Receive real-time, context-aware instructions immediately.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB Atlas, Mongoose
- **Recommendation Engine:** Python FastAPI microservice — TF-IDF Cosine Similarity (scikit-learn) + LLM Verification (Gemma-4-31b-it via OpenRouter)
- **AI Chat:** Multi-turn conversational assistant with conversation history (OpenRouter / Gemma-4-31b-it)

---

> ℹ️ *This project is actively maintained and updated for hackathon showcases and real-world deployment evaluation.*
