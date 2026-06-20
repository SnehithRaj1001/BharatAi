import sys
import json
import os
import datetime
import pandas as pd
from bson import ObjectId
from pymongo import MongoClient
from urllib.parse import urlparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI


# ── Custom JSON encoder to handle BSON / datetime types ──────────────────────
class MongoEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        try:
            from bson import Timestamp
            if isinstance(obj, Timestamp):
                return obj.as_doc()
        except ImportError:
            pass
        return super().default(obj)


def get_db_name(mongo_uri):
    """Extract DB name from URI path; fall back to 'test'."""
    try:
        parsed = urlparse(mongo_uri)
        db_name = parsed.path.lstrip('/').split('?')[0].strip()
        return db_name if db_name else 'test'
    except Exception:
        return 'test'


def get_db_schemes(mongo_uri):
    client = MongoClient(mongo_uri)
    db = client[get_db_name(mongo_uri)]
    raw = list(db['schemes'].find({}))
    for doc in raw:
        doc['_id'] = str(doc['_id'])
    return pd.DataFrame(raw)


def build_user_query(p):
    """
    Convert a structured user profile dict into a rich natural-language
    paragraph that mirrors the vocabulary used in scheme eligibility text.
    This dramatically improves TF-IDF overlap with scheme documents.
    """
    parts = []

    # Basic demographics
    age = int(p.get('age', 0))
    gender = p.get('gender', '')
    parts.append(f"The applicant is a {age} year old {gender.lower()} citizen of India.")

    # Location
    state = p.get('state', '')
    district = p.get('district', '')
    residence = p.get('residenceType', 'Urban')
    loc = f"The applicant is a permanent resident of {state}"
    if district:
        loc += f", {district} district"
    loc += f". The applicant lives in a {residence.lower()} area."
    parts.append(loc)

    # Marital status
    marital = p.get('maritalStatus', '')
    if marital:
        parts.append(f"The applicant is {marital.lower()}.")
    if marital == 'Widowed':
        parts.append("The applicant is a widow or widower.")

    # Education
    edu = p.get('education', '')
    parts.append(f"Educational qualification: {edu}.")
    if 'Secondary' in edu or '10th' in edu or '12th' in edu:
        parts.append("The applicant has passed Secondary School Certificate SSC or Higher Secondary Certificate HSC.")
    if 'Graduate' in edu or 'Degree' in edu:
        parts.append("The applicant holds a graduate degree.")

    # Occupation & Employment
    occ = p.get('occupation', '')
    emp = p.get('employmentStatus', '')
    parts.append(f"The applicant's occupation is {occ}. Employment status: {emp.lower()}.")
    if emp == 'Unemployed':
        parts.append("The applicant is an unemployed youth seeking employment.")
    if emp == 'Daily Wage Worker':
        parts.append("The applicant is a daily wage worker casual labourer.")

    # Income
    income = int(p.get('annualIncome', 0))
    bpl = p.get('bplStatus', 'No')
    ration = p.get('rationCardType', 'None')
    parts.append(f"Annual income of the family is Rs.{income}/-.")
    if income <= 100000:
        parts.append("The applicant belongs to the economically weaker section EWS with very low income below poverty line.")
    elif income <= 300000:
        parts.append("The annual income is less than or equal to Rs.3,00,000/-.")
    elif income <= 600000:
        parts.append("The annual income is less than or equal to Rs.6,00,000/-.")
    if bpl == 'Yes':
        parts.append("The applicant is a BPL Below Poverty Line card holder.")
    if 'BPL' in ration or 'Antyodaya' in ration or 'PHH' in ration:
        parts.append(f"The applicant holds a {ration} ration card.")

    # Social category
    cat = p.get('category', 'General')
    parts.append(f"The applicant belongs to the {cat} category.")
    if 'SC' in cat:
        parts.append("The applicant is from Scheduled Caste community.")
    if 'ST' in cat:
        parts.append("The applicant is from Scheduled Tribe community.")
    if 'OBC' in cat:
        parts.append("The applicant belongs to Other Backward Class OBC.")
    if 'VJNT' in cat or 'NT' in cat:
        parts.append("The applicant is from Vimukta Jati Nomadic Tribe VJNT NT community.")
    if 'EWS' in cat:
        parts.append("The applicant is from Economically Weaker Section EWS general category.")

    religion = p.get('religion', '')
    minority = p.get('minority', 'No')
    if religion and religion != 'Not Specified':
        parts.append(f"The applicant's religion is {religion}.")
    if minority == 'Yes':
        parts.append("The applicant belongs to a notified minority community.")

    # Special flags — student
    if p.get('studentStatus') == 'Yes':
        parts.append("The applicant is a student currently pursuing education.")
        parts.append("The applicant is enrolled in a school college university degree course.")

    # Farmer
    if p.get('farmerStatus') == 'Yes':
        parts.append("The applicant is a farmer engaged in agricultural activities.")
        land = p.get('landOwnership', 'No')
        acres = float(p.get('landSizeAcres', 0))
        if land == 'Yes':
            parts.append(f"The applicant owns {acres} acres of agricultural land.")
        else:
            parts.append("The applicant is a landless farmer or agricultural labourer.")

    # Entrepreneur
    if p.get('entrepreneurStatus') == 'Yes':
        parts.append("The applicant is an entrepreneur or self employed person willing to establish a new venture or business.")

    # Disability
    if p.get('disabilityStatus') == 'Yes':
        pct = int(p.get('disabilityPercentage', 40))
        parts.append(f"The applicant is a Person with Disability PwD with {pct}% disability.")
        if pct >= 40:
            parts.append("The disability percentage is 40% or above making the applicant eligible for disability schemes.")
        parts.append("The applicant is visually handicapped hearing impaired orthopedically handicapped or has a mental disability.")

    # Senior citizen
    if age >= 60 or p.get('seniorCitizen') == 'Yes':
        parts.append("The applicant is a senior citizen above 60 years of age.")

    # Ex-serviceman
    if p.get('exServiceman') == 'Yes':
        parts.append("The applicant is an ex-serviceman or defence personnel or veteran.")

    # Construction worker
    if p.get('constructionWorker') == 'Yes':
        parts.append("The applicant is a registered building and other construction worker under BOCW Maharashtra Building and Other Construction Workers Welfare Board MBOCWW.")

    return ' '.join(parts)


def normalize_scores(scores, top_score_target=0.92, min_score_floor=0.45):
    """
    Min-max normalize raw cosine scores to a meaningful 0-1 range.
    - The best matching scheme anchors at top_score_target (e.g. 0.92)
    - Others scale proportionally down, with a floor so even weak matches
      show as 'somewhat relevant' rather than 2-3%.
    """
    import numpy as np
    arr = scores.copy()
    mn, mx = arr.min(), arr.max()
    if mx == mn:
        return [top_score_target] * len(arr)
    # Normalize to [min_score_floor, top_score_target]
    normalized = min_score_floor + (arr - mn) / (mx - mn) * (top_score_target - min_score_floor)
    return normalized.round(3).tolist()


def llm_evaluate(user_profile, schemes, openrouter_key):
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key,
    )

    profile_str = json.dumps(user_profile, indent=2)
    schemes_str = ""
    for _, row in schemes.iterrows():
        schemes_str += f"Scheme:\n"
        schemes_str += f"  Name: {row.get('schemeName', '')}\n"
        elig = row.get('eligibility', [])
        if isinstance(elig, list):
            elig = ' '.join(elig)
        schemes_str += f"  Eligibility: {elig}\n\n"

    prompt = f"""You are BharatAI, an expert Indian government welfare scheme advisor.
Carefully assess if the following user is eligible for each scheme based on their profile.

User Profile:
{profile_str}

Schemes to evaluate:
{schemes_str}

Respond ONLY with a JSON object like:
{{
  "results": [
    {{
      "schemeName": "<exact scheme name>",
      "isEligible": true or false,
      "reasoning": "<1-2 sentence plain-English explanation of why they qualify or don't>",
      "missingRequirements": ["<specific requirement they don't meet, if any>"]
    }}
  ]
}}
"""

    try:
        completion = client.chat.completions.create(
            model="google/gemma-4-31b-it:free",
            messages=[
                {"role": "system", "content": "You are a JSON-only responder. Never include markdown code fences."},
                {"role": "user", "content": prompt}
            ]
        )
        content = completion.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        parsed = json.loads(content)
        return parsed.get("results", parsed)
    except Exception as e:
        return {"error": str(e)}


def safe_serialize(obj):
    """Recursively convert to JSON-safe types."""
    if isinstance(obj, dict):
        return {k: safe_serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_serialize(i) for i in obj]
    elif isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        try:
            from bson import Timestamp
            if isinstance(obj, Timestamp):
                return str(obj)
        except Exception:
            pass
        return obj


def pre_filter_schemes(df, p):
    """
    Hard logical filter to drop schemes that the user is fundamentally
    ineligible for (e.g. female schemes for men, disability schemes for non-disabled).
    This dramatically improves accuracy.
    """
    filtered = df.copy()

    # User profile attributes
    gender = p.get('gender', 'Male').lower()
    cat = p.get('category', 'General').lower()
    is_disabled = p.get('disabilityStatus', 'No') == 'Yes'
    is_student = p.get('studentStatus', 'No') == 'Yes'
    is_farmer = p.get('farmerStatus', 'No') == 'Yes'
    is_bocw = p.get('constructionWorker', 'No') == 'Yes'
    
    drop_indices = []

    for idx, row in filtered.iterrows():
        c = str(row.get('category', '')).lower()
        name = str(row.get('schemeName', '')).lower()
        desc = str(row.get('description', '')).lower()
        
        def join_list(val):
            if isinstance(val, list):
                return ' '.join(str(v) for v in val)
            return str(val) if val else ''
        
        elig = join_list(row.get('eligibility', [])).lower()
        
        tags_text = c + " " + name + " " + desc + " " + elig

        # 1. Gender constraints
        # If user is male, drop strictly female/women schemes
        if gender == 'male':
            if 'female' in tags_text or 'women' in tags_text or 'mahila' in tags_text or 'mata' in tags_text or 'kanya' in tags_text or 'pregnant' in tags_text or 'girl' in tags_text:
                drop_indices.append(idx)
                continue
                
        # 2. Disability constraints
        if not is_disabled:
            if 'disability' in c or 'disabled' in c or 'blind' in tags_text or 'impaired' in tags_text:
                drop_indices.append(idx)
                continue

        # 3. Farmer constraints
        if not is_farmer:
            if 'farmer' in c or 'agriculture' in c:
                drop_indices.append(idx)
                continue

        # 4. Student constraints
        if not is_student:
            # If the category is strictly education/school/scholarship
            if 'education' in c or 'school' in c or 'student' in c or 'scholarship' in tags_text:
                drop_indices.append(idx)
                continue

        # 5. Construction Worker constraints
        if not is_bocw:
            if 'construction worker' in c or 'bocw' in tags_text:
                drop_indices.append(idx)
                continue

        # 6. Caste / Category constraints
        # General category users should not see reserved schemes
        if cat == 'general':
            if 'scheduled caste' in tags_text or ' sc ' in tags_text or 'charmakar' in tags_text or 'dhor' in tags_text or \
               'scheduled tribe' in tags_text or ' st ' in tags_text or \
               'other backward' in tags_text or ' obc ' in tags_text or \
               'vjnt' in tags_text or 'nomadic tribe' in tags_text or ' nt ' in tags_text or \
               'special backward' in tags_text or ' sbc ' in tags_text:
                drop_indices.append(idx)
                continue
                
        # For reserved category users, ONLY drop schemes that are EXCLUSIVELY for a different reserved category
        # If the user is VJNT, we should only drop schemes that mention SC/ST/OBC but DO NOT mention VJNT/NT.
        else:
            mentions_sc = 'scheduled caste' in tags_text or ' sc ' in tags_text or 'charmakar' in tags_text or 'dhor' in tags_text
            mentions_st = 'scheduled tribe' in tags_text or ' st ' in tags_text
            mentions_obc = 'other backward' in tags_text or ' obc ' in tags_text
            mentions_vjnt = 'vjnt' in tags_text or 'nomadic tribe' in tags_text or ' nt ' in tags_text
            mentions_sbc = 'special backward' in tags_text or ' sbc ' in tags_text
            
            # Did the scheme mention any reserved category at all?
            any_reserved = mentions_sc or mentions_st or mentions_obc or mentions_vjnt or mentions_sbc
            
            if any_reserved:
                # Does the scheme mention the USER's specific category?
                user_match = False
                if 'sc' in cat and mentions_sc: user_match = True
                if 'st' in cat and mentions_st: user_match = True
                if 'obc' in cat and mentions_obc: user_match = True
                if 'vjnt' in cat and mentions_vjnt: user_match = True
                if 'nt' in cat and mentions_vjnt: user_match = True
                if 'sbc' in cat and mentions_sbc: user_match = True
                
                # If it mentions reserved categories, but NOT the user's category, drop it
                if not user_match:
                    drop_indices.append(idx)
                    continue

    return filtered.drop(index=drop_indices).reset_index(drop=True)


def main():
    input_data = sys.stdin.read()
    if not input_data:
        print(json.dumps({"error": "No input data provided"}))
        return

    try:
        user_profile = json.loads(input_data)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
        return

    mongo_uri = os.environ.get("MONGODB_URI")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    if not mongo_uri or not openrouter_key:
        print(json.dumps({"error": "Missing MONGODB_URI or OPENROUTER_API_KEY"}))
        return

    try:
        # 1. Fetch schemes from DB
        raw_df = get_db_schemes(mongo_uri)
        if raw_df.empty:
            print(json.dumps({"error": "No schemes found in database. Run seed_db.js first."}))
            return

        # 1.5 Hard pre-filter based on logical rules
        df = pre_filter_schemes(raw_df, user_profile)
        
        sys.stderr.write(f"Pre-filter kept {len(df)} out of {len(raw_df)} schemes.\n")

        if df.empty:
            print(json.dumps({"top_ml_matches": [], "llm_evaluation": []}))
            return

        def join_list(val):
            if isinstance(val, list):
                return ' '.join(str(v) for v in val)
            return str(val) if val else ''

        # 2. Build rich combined text for each scheme
        df['combined_text'] = (
            df['schemeName'].fillna('') + ' ' +
            df.get('category', pd.Series([''] * len(df))).fillna('') + ' ' +
            df.get('description', pd.Series([''] * len(df))).fillna('') + ' ' +
            df.get('benefits', pd.Series([[] for _ in range(len(df))])).apply(join_list) + ' ' +
            df.get('eligibility', pd.Series([[] for _ in range(len(df))])).apply(join_list) + ' ' +
            df.get('requiredDocuments', pd.Series([[] for _ in range(len(df))])).apply(join_list)
        )

        # 3. Build rich natural-language user query (key improvement)
        user_text = build_user_query(user_profile)

        # 4. TF-IDF cosine similarity
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),   # bigrams capture "annual income", "scheduled caste" etc.
            min_df=1,
            sublinear_tf=True,    # dampens frequency dominance
        )
        all_texts = df['combined_text'].tolist() + [user_text]
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        raw_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()

        # 4.5 Hierarchical Keyword Boost
        # We manually boost the TF-IDF score based on strict priorities:
        # Priority 1: Gender (30% boost)
        # Priority 2: Caste / Social Category (25% boost)
        # Priority 3: Economic Condition (20% boost)
        # Priority 4: Special Status like Disability/Farmer (20% boost)
        # Priority 5: Specific Education (15% boost)
        
        user_gender = user_profile.get('gender', '').lower()
        user_cat = user_profile.get('category', '').lower()
        user_income = int(user_profile.get('annualIncome', 0))
        user_bpl = user_profile.get('bplStatus', 'No').lower()
        user_edu = user_profile.get('education', '').lower()
        user_disabled = user_profile.get('disabilityStatus', 'No').lower() == 'yes'
        user_farmer = user_profile.get('farmerStatus', 'No').lower() == 'yes'
        
        for i, row in df.iterrows():
            tags = row['combined_text'].lower()
            multiplier = 1.0
            
            # 1. Gender Boost (Only if Female/Transgender)
            if user_gender in ['female', 'transgender']:
                if 'female' in tags or 'women' in tags or 'mahila' in tags or 'girl' in tags or 'maternity' in tags:
                    multiplier += 0.30
                    
            # 2. Caste / Category Boost
            if user_cat != 'general' and user_cat in tags:
                multiplier += 0.25
                
            # 3. Economic Condition Boost
            if user_bpl == 'yes' or user_income <= 100000:
                if 'bpl' in tags or 'below poverty line' in tags or 'ews' in tags or 'economically weaker' in tags:
                    multiplier += 0.20
                    
            # 4. Special Status Boost
            if user_disabled and ('disabled' in tags or 'disability' in tags or 'blind' in tags):
                multiplier += 0.20
            if user_farmer and ('farmer' in tags or 'agriculture' in tags or 'krishi' in tags):
                multiplier += 0.20
            
            # 5. Specific Education Boost
            if ('iti' in user_edu or 'diploma' in user_edu) and ('iti' in tags or 'diploma' in tags):
                multiplier += 0.15
                
            raw_scores[i] = min(1.0, raw_scores[i] * multiplier)

        # 5. Normalize scores to meaningful 0–100 range
        normalized = normalize_scores(raw_scores)
        df['raw_score'] = raw_scores
        df['match_score'] = normalized  # overwrite with normalized %

        # 6. Return top 5 schemes
        top_schemes = df.nlargest(5, 'raw_score').drop(columns=['combined_text', 'raw_score'])

        # 7. LLM eligibility assessment on top 5
        llm_results = llm_evaluate(user_profile, top_schemes, openrouter_key)

        # 8. Safe-serialize
        top_records = [safe_serialize(row) for row in top_schemes.to_dict(orient='records')]

        final_output = {
            "top_ml_matches": top_records,
            "llm_evaluation": llm_results
        }

        print(json.dumps(final_output, cls=MongoEncoder))

    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))


if __name__ == "__main__":
    main()
