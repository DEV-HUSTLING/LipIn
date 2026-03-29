# LipIn - LinkedIn Enhancement Platform

## Complete Technical Documentation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
   - [Core Modules](#core-modules)
   - [Profile Analyst Module](#profile-analyst-module)
   - [Dashboard Module](#dashboard-module)
   - [API Reference](#api-reference)
4. [Frontend Documentation](#frontend-documentation)
   - [Chrome Extension Structure](#chrome-extension-structure)
   - [Components](#components)
   - [Content Scripts](#content-scripts)
5. [Database Schema](#database-schema)
6. [Deployment](#deployment)
7. [Configuration](#configuration)
8. [Code Review Summary](#code-review-summary)

---

## Project Overview

**LipIn** is an AI-powered LinkedIn enhancement platform that helps professionals optimize their LinkedIn presence through:

- **AI Comment Generation**: Generate contextual, tone-appropriate comments on LinkedIn posts
- **Profile Optimization**: AI-driven suggestions for headlines, about sections, and experience descriptions
- **LinkedIn Scraping**: Extract profile data for analysis and optimization
- **Niche Recommendations**: Career positioning and SSI (Social Selling Index) improvement strategies
- **Comment Tracking**: Monitor and track daily commenting activity

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, MUI v7, Tailwind CSS |
| **Backend** | FastAPI, Python 3.10, Uvicorn |
| **AI/ML** | OpenAI GPT-4o-mini, GPT-3.5-turbo |
| **Database** | Firebase Firestore |
| **Scraping** | Playwright (Chromium) |
| **Deployment** | Docker, Render |

---

## Architecture

```
LipIn/
├── lipIn/                      # Chrome Extension (Frontend)
│   ├── src/
│   │   ├── App.jsx            # Popup main component
│   │   ├── comment.jsx        # Comment generation UI
│   │   ├── CommentTracker.jsx # Comment statistics
│   │   ├── auth/              # Firebase authentication
│   │   ├── content/           # Content scripts
│   │   ├── dashboard/         # Dashboard components
│   │   └── helpers/           # Utility functions
│   ├── public/                # Build output & assets
│   └── package.json
│
├── lipInBackEnd/              # FastAPI Backend
│   ├── main.py               # Application entry point
│   ├── config.py             # Configuration & clients
│   ├── cache.py              # Firestore caching layer
│   ├── llm_utils.py          # Async LLM utilities
│   ├── profileAnalyst/       # LinkedIn scraping module
│   │   ├── scraper.py        # Playwright scraper
│   │   ├── routes.py         # API endpoints
│   │   └── prompts.py        # AI prompts
│   ├── lipInDashboard/       # Dashboard API module
│   │   ├── routes.py         # API endpoints
│   │   ├── prompts.py        # AI prompts
│   │   └── helper.py         # Utility classes
│   ├── Dockerfile            # Container configuration
│   ├── render.yaml           # Render deployment config
│   └── requirements.txt      # Python dependencies
│
└── DOCUMENTATION.md          # This file
```

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chrome         │────▶│  FastAPI        │────▶│  Firebase       │
│  Extension      │     │  Backend        │     │  Firestore      │
│  (React)        │◀────│  (Python)       │◀────│  (Database)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │  OpenAI API     │
        │               │  (GPT-4o-mini)  │
        │               └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  LinkedIn       │     │  Playwright     │
│  (DOM Injection)│     │  (Scraping)     │
└─────────────────┘     └─────────────────┘
```

---

## Backend Documentation

### Core Modules

#### main.py

**Purpose**: FastAPI application entry point and configuration.

```python
# Key Features:
- CORS middleware for cross-origin requests
- Router mounting for modular endpoints
- Health check and cache management endpoints
```

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check / welcome message |
| DELETE | `/clear-cache` | Clear all cached profile data |

**CORS Origins**:
- `localhost:3000`, `localhost:3001`, `localhost:8000`
- `https://lipin.onrender.com`
- `https://lipindashboard.netlify.app`
- `chrome-extension://*`

---

#### config.py

**Purpose**: Initialize external service clients and load environment variables.

**Exports**:

| Name | Type | Description |
|------|------|-------------|
| `client` | `OpenAI` | Synchronous OpenAI client |
| `async_client` | `AsyncOpenAI` | Asynchronous OpenAI client |
| `db` | `firestore.Client` | Firestore database client |

**Environment Variables Required**:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (auto-loaded) |
| `FIREBASE_API` | Path to Firebase service account JSON |

---

#### cache.py

**Purpose**: Firestore-based caching layer with TTL (Time-To-Live) support.

**Configuration**:
- `CACHE_TTL_MINUTES`: 30 minutes
- `CACHE_ENABLED`: True (toggle for development)

**Functions**:

| Function | Signature | Description |
|----------|-----------|-------------|
| `get_cached_profile` | `async (profile_url: str) -> dict \| None` | Retrieve cached data if not expired |
| `set_cached_profile` | `async (profile_url: str, profile_data: dict) -> None` | Store data with TTL |
| `invalidate_cache` | `async (profile_url: str) -> None` | Delete specific cache entry |
| `clear_all_cache` | `() -> int` | Delete all cache entries, return count |

**Cache Key Generation**:
```python
# MD5 hash of normalized profile URL
cache_key = hashlib.md5(profile_url.strip().encode()).hexdigest()
```

---

#### llm_utils.py

**Purpose**: Utility functions for async OpenAI API calls.

**Functions**:

| Function | Description |
|----------|-------------|
| `parallel_llm_calls(tasks: list[dict])` | Execute multiple LLM calls concurrently using `asyncio.gather` |
| `single_llm_call(messages, model, max_tokens, temperature, **kwargs)` | Single async completion call |

**Usage Example**:
```python
tasks = [
    {"model": "gpt-4o-mini", "messages": [...], "max_tokens": 800},
    {"model": "gpt-4o-mini", "messages": [...], "max_tokens": 1500},
]
results = await parallel_llm_calls(tasks)
```

---

### Profile Analyst Module

#### profileAnalyst/scraper.py

**Purpose**: LinkedIn profile scraping using Playwright with anti-detection measures.

**Public Functions**:

| Function | Description |
|----------|-------------|
| `setup_session()` | Opens browser for manual LinkedIn login. Session persists in `linkedin_browser_data/` |
| `scrape_profile(profile_url, headless=True)` | Scrapes full profile and returns structured data |

**Anti-Detection Features**:
- Randomized delays between actions (1-3 seconds)
- Human-like smooth scrolling
- Persistent browser context with saved cookies
- Custom user agent string
- Disabled automation flags

**Data Extracted**:

```python
{
    "profile_url": str,
    "basic_info": {
        "name": str,
        "headline": str,
        "location": str,
        "profile_picture_url": str,
        "connections": str | int,  # "500+" or number
        "followers": int
    },
    "about": str,
    "experience": [
        {
            "title": str,
            "company": str,
            "duration": str,
            "location": str,
            "description": str
        }
    ],
    "education": [
        {
            "school": str,
            "degree": str,
            "dates": str
        }
    ],
    "skills": [str],
    "certifications": [
        {
            "name": str,
            "issuing_org": str,
            "date": str
        }
    ],
    "recent_posts": [
        {
            "text": str,
            "reactions": str,
            "comments": str
        }
    ],
    "scraped_date": str
}
```

**CLI Usage**:
```bash
# Setup browser session (one-time)
python scraper.py --setup

# Scrape a profile
python scraper.py --url "https://www.linkedin.com/in/username" --output profile.json

# Scrape with visible browser
python scraper.py --url "..." --visible
```

---

#### profileAnalyst/routes.py

**Purpose**: API endpoints for profile scraping and analysis.

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/profile_analyst/scrape` | Scrape LinkedIn profile |
| GET | `/profile_analyst/setup` | Trigger browser login setup |
| GET | `/profile_analyst/score_profile` | AI-powered profile scoring |

**POST /profile_analyst/scrape**

Request:
```json
{
    "profile_url": "https://www.linkedin.com/in/username",
    "headless": true
}
```

Response:
```json
{
    "success": true,
    "data": { /* scraped profile data */ },
    "document_id": "firestore_doc_id",
    "message": "Profile scraped and added to database successfully."
}
```

**GET /profile_analyst/score_profile**

Query Parameters:
- `profile_url` (required): LinkedIn profile URL or username

Response:
```json
{
    "success": true,
    "data": {
        "total_score": 75,
        "section_scores": [
            {
                "section_name": "Visual Branding",
                "score": 8,
                "max_score": 10,
                "current": { /* actual data */ },
                "observations": {
                    "analysis": ["..."],
                    "improvements": ["..."]
                }
            }
        ],
        "quick_wins": ["..."],
        "benchmarking": {
            "your_score": 75,
            "max_possible": 100,
            "tier": "Intermediate",
            "percentile": 65,
            "industry_average": 65
        }
    }
}
```

---

#### profileAnalyst/prompts.py

**Purpose**: AI prompt templates for profile scoring.

**Classes**:

| Class | Purpose |
|-------|---------|
| `ProfileScoringPrompt` | Generates prompts for LinkedIn profile evaluation |

**Scoring Sections** (Total: 100 points):
1. Visual Branding (10 pts)
2. Headline (15 pts)
3. About (20 pts)
4. Experience (25 pts)
5. Skills (10 pts)
6. Recommendations (5 pts)
7. Network (5 pts)
8. Activity (10 pts)

---

### Dashboard Module

#### lipInDashboard/routes.py

**Purpose**: API endpoints for the dashboard and AI features.

**Endpoints Summary**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/postGenerator` | Generate LinkedIn posts |
| GET | `/profileBuilder` | Get AI profile suggestions |
| GET | `/profileAnalysis` | Get niche recommendations |
| POST | `/SelectedNiche` | Save selected niche |
| POST | `/personalInfo` | Save onboarding data |
| POST | `/signin` | Check user existence |
| POST | `/AIcomments` | Generate AI comments |
| POST | `/AIposts` | Generate post content |
| POST | `/askAIChats` | Conversational AI |
| POST | `/nicheRecommendations` | Get niche-specific SSI tips |

---

**POST /postGenerator**

Generate LinkedIn post content with AI.

Request (multipart/form-data):
```
profile_url: string (required)
prompt: string (required)
tone: string (optional)
language: string (optional)
history: string[] (optional)
attachments: File[] (optional)
```

Response:
```json
{
    "response": "Generated LinkedIn post content..."
}
```

---

**GET /profileBuilder**

Get AI-optimized profile suggestions.

Query Parameters:
- `profile_url` (required)
- `niche` (optional)

Response:
```json
{
    "success": true,
    "data": {
        "headline": {
            "current": "Current headline",
            "suggestions": [
                {
                    "id": 1,
                    "recommendation": "Suggested headline",
                    "confidenceScore": 85,
                    "bestFor": "Technical recruiters"
                }
            ]
        },
        "about": { /* similar structure */ },
        "experience": {
            "current": [],
            "positions": [
                {
                    "role": "Job Title",
                    "company": "Company",
                    "keywords": ["..."],
                    "suggestions": [...]
                }
            ]
        },
        "skills": {
            "current": [],
            "skillsToPrioritize": ["Python", "AWS", "..."]
        }
    }
}
```

---

**POST /AIcomments**

Generate AI-powered LinkedIn comments.

Request:
```json
{
    "post": "The LinkedIn post content...",
    "prompt": "Optional custom instructions",
    "tone": "Professional, positive, conversational tone",
    "persona": "Mid level professional...",
    "language": "Use American English..."
}
```

Response:
```json
{
    "comment": "Generated comment text..."
}
```

---

**POST /nicheRecommendations**

Get niche-specific SSI improvement recommendations.

Request:
```json
{
    "profile_url": "username",
    "niche": "Data Engineering"
}
```

Response:
```json
{
    "success": true,
    "data": [
        {
            "component": "Establish your professional brand",
            "niche_focus": "Data Engineering",
            "recommendations": [
                "Specific actionable recommendation 1",
                "..."
            ]
        },
        { /* 3 more SSI components */ }
    ]
}
```

---

#### lipInDashboard/prompts.py

**Purpose**: AI prompt templates for various features.

**Classes**:

| Class | Purpose | Output |
|-------|---------|--------|
| `ProfileBuilderPrompt` | Profile optimization suggestions | JSON with headline, about, experience, skills |
| `PostGenPrompt` | LinkedIn post generation | Plain text post |
| `NicheSpecificRecommendation` | SSI tips for specific niche | JSON array of recommendations |
| `NicheRecommendation` | Career niche suggestions | JSON with 5 ranked niches |
| `SSIImageProcessing` | Extract SSI data from screenshot | JSON with scores |
| `SSIRecommendations` | General SSI improvement tips | JSON array |
| `Comments` | Comment generation | Plain text comment |

**Comment Tones Supported**:
- Formal
- Appreciate
- Add Value
- Curious
- Differ

---

#### lipInDashboard/helper.py

**Purpose**: Utility classes for file processing and JSON cleaning.

**Classes**:

| Class | Methods | Description |
|-------|---------|-------------|
| `File_to_Base64` | `file_to_base64(file)` | Convert uploaded file to base64 (max 800KB) |
| `Clean_JSON` | `clean_json_response()` | Parse and clean AI JSON responses |
| `Image_Processor` | `convert_img_to_str()` | OCR extraction using pytesseract |
| `Simple_File_Handler` | `get_file_summary()`, `should_use_base64()` | File type detection and summaries |

---

## Frontend Documentation

### Chrome Extension Structure

```
lipIn/
├── manifest.json          # Extension configuration
├── public/
│   ├── customAssets/      # Extension icons and logos
│   └── assets/            # Built JS/CSS bundles
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Popup component
│   ├── App.css           # Popup styles
│   ├── index.css         # Global styles
│   ├── comment.jsx       # Comment generation component
│   ├── CommentTracker.jsx # Comment statistics
│   ├── auth/
│   │   ├── firebase.jsx  # Firebase client setup
│   │   └── authAPI.js    # Auth utilities
│   ├── content/
│   │   ├── index.js      # Content script entry
│   │   ├── utils.jsx     # DOM injection utilities
│   │   └── content.css   # Injected styles
│   ├── dashboard/        # Dashboard components
│   └── helpers/
│       └── browserTheme.jsx # Theme detection
└── vite.config.js        # Build configuration
```

---

### Components

#### App.jsx

**Purpose**: Main popup component for the Chrome extension.

**Features**:
- Persona text area for personalized AI responses
- Language/dialect selector (8 options)
- Settings persistence via Chrome storage
- Dashboard launch button
- CommentTracker integration

**State Variables**:

| State | Type | Description |
|-------|------|-------------|
| `expand` | boolean | Toggle info card visibility |
| `persona` | string | User's persona description |
| `accentSelected` | string | Selected language preference |
| `personaStatus` | boolean | Show save confirmation |

**Language Options**:
- British English (Simple/Professional)
- American English (Simple/Professional)
- Australian English (Simple/Professional)
- Indian English (Simple/Professional)

---

#### comment.jsx

**Purpose**: AI comment generation UI injected into LinkedIn posts.

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `postEl` | HTMLElement | The LinkedIn post container |
| `cmntArea` | HTMLElement | The comment text area |
| `getCmntArea` | Function | Callback to find comment area |

**Features**:
- Automatic theme detection (light/dark)
- Tone selection (5 options with icons)
- Custom prompt input
- Real-time comment insertion
- Firebase comment tracking
- Duplicate save prevention

**Tone Options**:

| Tone | Icon | Purpose |
|------|------|---------|
| Formal | WorkOutlineIcon | Professional credibility |
| Appreciate | HandshakeIcon | Express gratitude |
| Add Value | TipsAndUpdatesIcon | Share insights/experience |
| Curious | QuestionAnswerIcon | Ask thoughtful questions |
| Differ | SentimentNeutralIcon | Respectful counterpoints |

**Event Flow**:
1. User clicks LipIn button on post
2. Comment panel appears with input field
3. User optionally selects tone
4. User enters custom prompt (optional)
5. Clicks send to generate comment
6. AI comment inserted into LinkedIn editor
7. When user clicks "Post", comment saved to Firebase

---

#### CommentTracker.jsx

**Purpose**: Display comment statistics in the popup.

**Features**:
- Real-time Firestore listener
- Date picker for historical data
- 7-day and 30-day aggregations
- Comment deduplication

**State Variables**:

| State | Type | Description |
|-------|------|-------------|
| `url` | string | User's LinkedIn profile URL |
| `dailycounts` | object | Comments per day mapping |
| `todayDate` | Dayjs | Selected date |
| `periodSelected` | number | Time period in milliseconds |
| `finalCounts` | number | Total for selected period |

**Firestore Queries**:
- Daily count: `where('createdAt', '==', todayTimestamp)`
- Period count: `where('createdAt', '>=', startDate).where('createdAt', '<=', endDate)`

---

### Content Scripts

#### content/index.js

**Purpose**: Main content script that runs on LinkedIn pages.

**Features**:
- Profile URL extraction from sidebar
- Comment button click detection
- React component injection
- Firebase comment saving
- DOM mutation observation

**Profile URL Extraction**:
```javascript
// Looks for profile link in sidebar
const profileLink = sidebar.querySelector('a[data-view-name="identity-self-profile"]');
// Saves to chrome.storage.local with key "profileURl"
chrome.storage.local.set({ profileURl: absoluteUrl });
```

**Comment Button Detection**:
Handles 4 different LinkedIn button selectors:
1. `[data-view-name="feed-comment-button"]`
2. `button.comment-button`
3. `button[aria-label*="comment"]`
4. `.comments-comment-button`

---

#### content/utils.jsx

**Purpose**: Utility functions for DOM manipulation.

**Functions**:

| Function | Description |
|----------|-------------|
| `CommentComponent(postEl, postContainer)` | Mount React Comment component into LinkedIn DOM |
| `getPostDescription(postEl)` | Extract post text content for AI context |

**DOM Injection Strategy**:
1. Check for existing LipIn elements (prevent duplicates)
2. Find button container using multiple selector strategies
3. Create container div with `data-lipin-comment-root` attribute
4. Mount React component using `createRoot`

---

## Database Schema

### Firestore Collections

#### users/{profileId}/profileInfo

Stores scraped LinkedIn profile data.

```typescript
{
    profile_url: string,
    basic_info: {
        name: string,
        headline: string,
        location: string,
        profile_picture_url: string,
        connections: string | number,
        followers: number
    },
    about: string,
    experience: Array<{
        title: string,
        company: string,
        duration: string,
        location: string,
        description: string
    }>,
    education: Array<{...}>,
    skills: string[],
    certifications: Array<{...}>,
    recent_posts: Array<{...}>,
    scraped_date: string
}
```

#### users/{profileId}/personalInfo

Stores user onboarding data.

```typescript
{
    email: string,
    name: string,
    userDescription: string,
    purpose: string[],
    careerVision: string,
    headline: string,
    ssiScoreFiles: Array<{base64: string, ...}>,
    profileFileAnalytics: Array<{...}>,
    resumeFiles: Array<{...}>,
    currentExp: string,
    topicsFiles: string[],
    skillsFiles: string[],
    myValue: string[],
    niche: string  // Selected niche
}
```

#### comments/{profileId}/items

Stores tracked comments.

```typescript
{
    text: string,
    createdAt: number,      // Timestamp (midnight of day)
    timestamp: string       // ISO 8601 timestamp
}
```

#### cache/{cacheKey}

Stores cached API responses.

```typescript
{
    profile_data: object,
    profile_url: string,
    expires_at: Timestamp,
    created_at: Timestamp
}
```

---

## Deployment

### Docker Deployment

**Dockerfile** features:
- Python 3.10-slim base image
- Playwright system dependencies pre-installed
- Layer caching for faster builds
- Dynamic PORT support

```bash
# Build image
docker build -t lipin-backend .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e FIREBASE_API=/app/firebase-creds.json \
  lipin-backend
```

### Render Deployment

**Using render.yaml** (Infrastructure as Code):
```yaml
services:
  - type: web
    name: lipin-backend
    env: docker
    region: oregon
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: PORT
        value: 8000
```

**Manual Setup**:
1. Connect GitHub repository
2. Set Build Command: `./build.sh`
3. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `PYTHON_VERSION`: `3.10.16`
   - `PLAYWRIGHT_BROWSERS_PATH`: `/opt/render/.cache`
   - `OPENAI_API_KEY`: Your key
   - `FIREBASE_CREDENTIALS`: JSON content

---

## Configuration

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `FIREBASE_API` | Yes | Path to Firebase service account JSON |
| `PORT` | No | Server port (default: 8000) |
| `PLAYWRIGHT_BROWSERS_PATH` | No | Custom browser path for deployment |

### Frontend Configuration

**Chrome Storage Keys**:

| Key | Type | Description |
|-----|------|-------------|
| `profileURl` | string | User's LinkedIn profile URL |
| `persona` | string | User's persona description |
| `language` | string | Selected language preference |

---

## Code Review Summary

### Strengths

1. **Clean Architecture**: Modular design with clear separation of concerns
2. **Async Implementation**: Proper use of AsyncOpenAI and asyncio
3. **Caching Layer**: Smart Firestore caching with TTL
4. **Robust Scraper**: Anti-detection measures and fallback strategies
5. **Comprehensive Prompts**: Well-engineered AI prompts
6. **Real-time Updates**: Firestore onSnapshot for live data

### Areas for Improvement

1. **Security**: Move Firebase credentials to environment variables
2. **Type Safety**: Add TypeScript to frontend
3. **Testing**: Add unit and E2E tests
4. **Error Handling**: Implement consistent error responses
5. **Logging**: Replace console.log with proper logging service
6. **Rate Limiting**: Add API rate limiting middleware

### Priority Actions

| Priority | Action |
|----------|--------|
| URGENT | Remove hardcoded Firebase credentials |
| HIGH | Add environment variable configuration |
| MEDIUM | Fix typos, remove dead code |
| LOW | Add comprehensive test coverage |

---

## License

[Add your license information here]

---

## Contributing

[Add contributing guidelines here]

---

## Support

For issues and feature requests, please open an issue on GitHub.

---

*Documentation generated on 2026-02-18*
