from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

load_dotenv()
app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API"))

class CommentsBody(BaseModel):
    post: str
    prompt: str | None = None #Optional field with a default value of None
    tone: str | None = None #Optional field with a default value of None
    persona: str | None = None #Optional field with a default value of None
    language: str | None = None #Optional field with a default value of None
class profileLink(BaseModel):
    profile_url: str
class PostBody(BaseModel):
    userReq: str
    # prompt: str
origins = [
    "http://localhost:3000",  # React default
    "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    "http://localhost:8000",  # React default

    "https://myfrontenddomain.com",
      "chrome-extension://mdopdgfnmofdffmlipbnflfbobefbeam"  # Production frontend
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # or ["*"] to allow all (not recommended in prod)
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],         # Allow all headers
    # Allow chrome-extension:// origins used by unpacked extensions during development.
    # exact origin matches are required by default; use a regex to permit any extension id.
    allow_origin_regex=r"^chrome-extension://.*$",
)
@app.get("/")
async def welcome():
    return {"message":"Welcome to the FASTAPI"}

@app.post("/AIcomments")
def get_ai_comments(body: CommentsBody):
    post = body.post
    prompt = body.prompt if body.prompt else "Professional, positive, conversational comment"
    tone = body.tone if body.tone else "Professional, positive, conversational tone"
    persona = body.persona if body.persona else "Mid level professional with a focus on collaboration and innovation"
    language = body.language if body.language else 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.'
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI that writes authentic, high-quality LinkedIn comments that sound like they were written by a real professional—not generic or promotional."},
                {"role": "user", "content": f"""

## User Profile
${persona}

## Post Content to Analyze
"${post}"

## Tone Requirements
${tone}

## Commenting Language
${language}

## User's Additional Instructions
${prompt}


## MANDATORY SPECIFICITY RULES:

🚫 BANNED PHRASES (DO NOT USE):
- "truly inspiring" / "inspiring journey"
- "really resonates" / "resonates with me"
- "well said" / "couldn't agree more"
- "powerful testament" / "testament to"
- "great insights" / "interesting perspective"
- Any phrase that sounds like a motivational poster
- Donot Quote an EXACT phrase, number, or example from the post

✅ REQUIRED ELEMENTS:
1. Reference an similar phrase, number, or example from the post
2. Share a CONCRETE, SPECIFIC experience with details (not vague relatability)
3. Use SPECIFIC language: names, numbers, timeframes, situations, not abstract concepts

---
---

✅ VARIED OPENING STYLES (rotate these):

1. **Direct Question**: "How long did the rollback take?"
2. **Stat/Number Hook**: "3-hour recovery is impressive—..."
3. **Shared Experience**: "Hit the same issue last month—..."
4. **Specific Detail**: "The validation checklist approach..."
5. **Casual Observation**: "Wait, you automated the rollback?"
6. **Challenge/Pushback**: "Interesting, but doesn't that slow deployment?"
7. **Direct Statement**: "This happened to us too."
8. **Tool/Method Reference**: "Using GitHub Actions for validation is smart—..."

ROTATE opening styles. DO NOT use "When you mentioned..." or similar patterns repeatedly.

---
## SPECIFICITY FORMULA:

Instead of: "Your journey is inspiring"
Write: "When you mentioned [EXACT DETAIL FROM POST], it reminded me of [SPECIFIC SITUATION with CONCRETE DETAILS]"

Instead of: "This resonates with my experience"
Write: "I faced the same issue when [SPECIFIC EVENT] - we solved it by [SPECIFIC ACTION] and saw [SPECIFIC RESULT]"

Instead of: "Great point about resilience"
Write: "The part where you [EXACT ACTION/QUOTE FROM POST] - did you [SPECIFIC FOLLOW-UP QUESTION]?"

---

## EXAMPLES OF ULTRA-SPECIFIC COMMENTS:

Post: "Moved to Berlin 2 years ago. The first 6 months were brutal - couldn't understand German bureaucracy, missed my mom's cooking, and my startup failed. But I rebuilt, learned the language, and just closed our Series A."

❌ Generic: "The resilience you've shown is truly inspiring. Your growth reflects deep personal transformation."

✅ Ultra-Specific: "The 6-month mark is brutal—I hit the same wall in Amsterdam and almost gave up. What made you stick it out? For me it was finding a Stammtisch that met Thursdays. Also, closing a Series A after a failed startup is a massive credibility boost with investors. How did you frame the failure story in your pitch?"

---

Post: "Unpopular opinion: Code reviews are killing productivity. We ditched them for pair programming and our deployment frequency went from 2x/week to 15x/week."

❌ Generic: "Interesting perspective on development workflows. Every team is different."

✅ Ultra-Specific: "15x deployments is wild but I'm skeptical—doesn't pair programming cut individual velocity in half? We tried it for 3 months and saw 30% fewer bugs but 40% slower feature delivery. Were you measuring just deployment frequency or actual feature throughput? Also curious if your team is < 10 people where this scales better."

---

Post: "Just failed my third startup in 5 years. Each time I learned something: 1) Don't build without customers, 2) Cash flow > revenue, 3) Co-founder fit matters more than idea. Now consulting and honestly happier."

❌ Generic: "Your growth journey shows incredible resilience. These lessons are valuable."

✅ Ultra-Specific: "The 'co-founder fit matters more than idea' lesson hit me hard. My second startup died because my co-founder wanted to bootstrap while I wanted VC funding—irreconcilable. Are you keeping consulting as your main gig or building runway for attempt #4? Also, what's your burn rate tolerance now vs startup #1?"

---

## YOUR TASK:

1. Find the MOST SPECIFIC element in the post:
   - A statistic or number
   - A concrete action they took
   - A specific challenge they faced
   - An exact quote or phrase
   - A named person, place, or thing

2. Build your comment around that SPECIFIC element using:
   - Exact references ("When you said X...", "The part about Y...", "Your Z approach...")
   - Concrete details from your experience (numbers, names, timeframes)
   - Specific follow-up questions with context
3. Persona alignment (CRITICAL)
   - The tone, perspective, vocabulary, and focus of the comment must fully reflect the provided persona {persona} and language {language}, including:
   - Their level of seniority or expertise
   - Their typical concerns, values, and priorities
   - How they would naturally speak, question, and relate experiences
   What they would care about or notice in this post
   ⚠️ Do not sound generic, neutral, or detached.
   ⚠️ Do not summarize the whole post.
   ⚠️ Do not invent details not implied by the post or plausible for the persona.
4. Make it IMPOSSIBLE to use this comment on another post
LENGTH REQUIREMENT:
- DEFAULT: 10 words (1-2 sentences MAX)
- ONLY write longer(2-4 sentences 50-100 words) if user explicitly says "long comment" or "detailed response"
- Count your words before outputting - if over 40 words without explicit request, CUT IT DOWN
## VALIDATION:
Before outputting, ask: "Could I copy-paste this to 3 other posts in the same category?"
- If YES → TOO GENERIC, add more specific details
- If NO → Good, output it

## OUTPUT:
Write the ultra-specific comment. NO generic phrases. NO abstract concepts. ONLY concrete specifics.
       
"""}
            ],
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )
        comment = response.choices[0].message.content.strip()
        print("prompt:", prompt)
        print("tone:", tone)
        print("persona:", persona)
        print("language:", language)
        return {"comment": comment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# API to create content for LinkedIn posts

@app.post("/AIposts")
def get_ai_postsContent(body: PostBody):
    userReq = body.userReq
    # prompt = body.prompt
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates engaging LinkedIn Posts."},
                {"role": "user", "content": f"""
                You are a LinkedIn content-creation assistant. You specialize in crafting polished, professional LinkedIn posts that resonate with a business audience.
                Your task is to analyze the following user's requirements and genrate high-quality Linkdin posts descriptionss based on those requirements.
                
                Your description must be suitable for LinkedIn, adhering to professional standards and best practices for engagement. 
                It should be clear, concise, and tailored to a business audience. 
                Language should be formal yet approachable, avoiding slang or overly casual expressions.
                
                Format:
                • The output should be structured with short paragraphs for easy readability.
                • Use bullet points or numbered lists where appropriate to enhance clarity.
                • Ensure the tone is professional, insightful, and value-driven.
                • If the user requests a specific style or format, ensure that the output aligns with those specifications. Give user's instructions high priority in your response.
                • Do NOT repeat the userReq verbatim—elevate and clarify it.  
                • No hashtags unless explicitly requested.  
                • No emojis unless explicitly requested. 
                • Only provide the post description as output; do not include any additional commentary or explanations. 
                This output will be used directly as LinkedIn post content, so it must be engaging and well-crafted. These posts are intended to foster professional connections and discussions on LinkedIn. 
                It will be viewed by a diverse audience of professionals and students so maintain a tone that is inclusive and respectful.
                
                 Input Data (User Requirements):
                 {userReq}
                
                Ouptut:
                Provie the LinkedIn post descriptions based on the above user requirements.
                Write only the final post descriptions (no explanations, no titles, no quotes).
                """}
            ],
            max_tokens=1000,
            n=1,
            stop=None,
            temperature=0.7,
        )
        posts = response.choices[0].message.content.strip()
        print(posts)
        return {"posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/AIprofile_scrapper")
# def get_ai_profile_scrapper(body: profileLink):
#     profile = body.profile_url
    
#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless=True)  # Add headless=True
#         page = browser.new_page()
        
#         try:
#             print(f"Scraping profile: {profile}")
#             page.goto(profile, wait_until='networkidle')  # Wait for network to be idle
            
#             # Wait for main content to load
#             page.wait_for_selector('main', timeout=10000)
            
#             html = page.content()
#             soup = BeautifulSoup(html, 'html.parser')
            
#             main_div = soup.find('main')
            
#             if main_div:
#                 sections = main_div.find_all('section')
#                 print(f"Found {len(sections)} sections")
                
#                 if len(sections) > 0:  # Check if index 3 exists
#                     about_section = sections[1]
#                     print(about_section)
#                     about_content = about_section.find('span', {'class': 'visually-hidden'})
                    
#                     if about_content:
#                         return {'about': about_content.text}
#                     else:
#                         return {'error': 'About content span not found'}
#                 else:
#                     return {'error': f'Only found {len(sections)} sections, need at least 4'}
#             else:
#                 return {'error': 'No main div found'}
        
#         except Exception as e:
#             return {'error': f'Error scraping profile: {str(e)}'}
        
#         finally:
#             browser.close()



if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))