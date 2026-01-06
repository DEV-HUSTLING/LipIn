from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import firebase_admin
from firebase_admin import credentials, firestore, storage
load_dotenv()
app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

fireCred = credentials.Certificate(os.getenv("FIREBASE_API"))
firebase_admin.initialize_app(fireCred)
db = firestore.client()
class CommentsBody(BaseModel):
    post: str
    prompt: str | None = None #Optional field with a default value of None
    tone: str | None = None #Optional field with a default value of None
    persona: str | None = None #Optional field with a default value of None
    language: str | None = None #Optional field with a default value of None

class PersonalInfo(BaseModel):
        url: str
        email:str
        name:str
        userDescription:str
        purpose:str
        careerVision:str
        SSIscore:str
        profileFileAnalytics:list
        profileFile:list
        resume: list
        currentExp:str
        additionalInfo:str

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
    "https://lipin.onrender.com",
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

@app.post("/personalInfo")
async def personal_info(body: PersonalInfo):
    doc_ref = (
        db.collection("personalInfo")
          .document(body.url)
          .collection("items")
    )
    add_data = doc_ref.add(body.model_dump())
    return {"id": add_data[1].id}


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
                {
  "role": "user",
  "content": """

## About Me (User Persona)
${persona}

## The Post I'm Commenting On
${post}

## Tone I Want to Use
${tone}

## Language
${language}

## Specific Instructions
${prompt}

---

## How I Respond Based on Post Type:

### 🎯 If It's About Hiring/Open Positions:
- Show genuine interest if it aligns with my background
- Ask specific questions about the role (tech stack, team size, remote policy, etc.)
- Share my email/contact if interested: "This sounds like a fit - I have experience with [specific skill]. Should I DM you or is there an email?"
- If not for me but know someone: "Not my area but this would be perfect for someone with [specific background]. Mind if I share?"
- Keep it short and actionable

### 🎉 If It's Celebrating a Milestone/Achievement:
- Acknowledge the specific achievement with real appreciation
- If I've been through something similar, share concrete details: "Hit this same milestone last year - the feeling when [specific moment] is unreal"
- If I haven't, ask a genuine question about their journey: "How long did it take from [starting point] to hit this?"
- Reference the actual numbers/metrics they shared
- Don't just say "congrats" - make it personal and specific

### 📚 If It's About Mistakes/Lessons Learned:
- Appreciate their transparency: "Takes guts to share this publicly"
- If I've made similar mistakes, share what happened and what I learned
- If I have a different approach, offer it constructively: "Have you tried [specific alternative]? We switched to that after [similar problem] and it cut [specific result]"
- Ask follow-up questions: "Did you consider [specific approach] or was there a reason that wouldn't work?"
- Never preach - stay curious and collaborative

### 🚀 If It's About New Tech/Tools/Methods (AI Agents, Frameworks, etc.):
- **FIRST: Understand the topic deeply** - if it's about AI agents, understand what they're building, the use case, the tech stack, the problem they're solving
- Ask specific, informed questions: "How does this compare to [similar tool/approach]?"
- Request concrete details: "What's the learning curve like?" or "Does it integrate with [relevant stack]?"
- Share if I've used it: "Tested this last month - [specific experience and result]"
- If it's useful, thank them genuinely: "Didn't know this existed - exactly what I needed for [specific use case]"
- **Show you understand the domain** - reference relevant concepts, tools, or challenges that someone with expertise would know
- If skeptical, ask clarifying questions rather than dismissing

### 💭 If It's an Opinion/Hot Take:
- Engage with their specific argument, not generic agreement/disagreement
- Challenge constructively with data or experience: "Interesting, but when we tried [their approach], we saw [specific result]. Did you account for [specific factor]?"
- Share a different perspective if I have one: "In my experience [specific situation] led to [different outcome]"
- Ask questions that probe deeper: "How does this work when [specific edge case]?"

### 📢 If It's Announcing Something (Product Launch, Article, Event):
- If genuinely interested: "Checking this out - specifically curious about [exact feature/topic]"
- Ask a real question: "Does it handle [specific use case I care about]?"
- Share if I've tried it: "Used the beta - the [specific feature] saved me [specific amount of time/money]"
- If not relevant to me: skip it or keep it ultra-short

---

## Rules I Follow When Commenting:

### 🚫 Phrases I Never Use:
- "truly inspiring" / "inspiring journey"
- "really resonates" / "resonates with me"
- "well said" / "couldn't agree more"
- "powerful testament" / "testament to"
- "great insights" / "interesting perspective"
- "Great post!" / "Thanks for sharing!"
- Anything that sounds like a motivational poster
- Don't quote EXACT phrases from the post

### ✅ What I Always Include:
- Reference a specific detail, number, or example from the post
- Share a CONCRETE experience from my own work (with real details)
- Use specifics: names, numbers, timeframes, situations - not vague concepts
- **Demonstrate understanding of the topic** - use domain-specific language naturally

### ✅ How I Like to Start Comments (I rotate these):
- Direct Question: "How long did the rollback take?"
- Stat/Number Hook: "3-hour recovery is impressive—..."
- Shared Experience: "Hit the same issue last month—..."
- Specific Detail: "The validation checklist approach..."
- Casual Observation: "Wait, you automated the rollback?"
- Challenge/Pushback: "Interesting, but doesn't that slow deployment?"
- Direct Statement: "This happened to us too."
- Tool/Method Reference: "Using GitHub Actions for validation is smart—..."
- Topic-Specific Hook: "The agentic workflow pattern you mentioned—..."

**I mix it up. I don't want to sound repetitive.**

---

## My Formula for Being Specific:

Instead of generic stuff like:
- "Your journey is inspiring"

I write:
- "When you mentioned [EXACT DETAIL], it reminded me of [SPECIFIC SITUATION with CONCRETE DETAILS]"

Instead of:
- "This resonates with my experience"

I write:
- "I faced the same issue when [SPECIFIC EVENT] - we solved it by [SPECIFIC ACTION] and saw [SPECIFIC RESULT]"

---

## Examples of How I Comment:

**Example 1 - AI Agents Post:**

Post: "Built an AI agent that handles customer support tickets. Reduced response time from 4 hours to 15 minutes. Using LangChain + GPT-4 with RAG on our docs."

❌ What I don't do: "This is really inspiring! Great work on implementing AI agents."

✅ What I actually write: "15 min response time is solid. How are you handling edge cases where the RAG doesn't have context? We hit 25% hallucination rate initially until we added confidence scoring."

---

**Example 2 - Startup Failure Post:**

Post: "Just failed my third startup in 5 years. Each time I learned something: 1) Don't build without customers, 2) Cash flow > revenue, 3) Co-founder fit matters more than idea. Now consulting and honestly happier."

❌ What I don't do: "Your growth journey shows incredible resilience. These lessons are valuable."

✅ What I actually write: "The 'co-founder fit matters more than idea' lesson hit me hard. My second startup died because my co-founder wanted to bootstrap while I wanted VC funding—irreconcilable. What's your burn rate tolerance now vs startup #1?"

---

**Example 3 - Code Review Opinion:**

Post: "Unpopular opinion: Code reviews are killing productivity. We ditched them for pair programming and our deployment frequency went from 2x/week to 15x/week."

❌ What I don't do: "Interesting perspective on development workflows. Every team is different."

✅ What I actually write: "15x deployments is wild but I'm skeptical—doesn't pair programming cut individual velocity in half? We tried it for 3 months and saw 30% fewer bugs but 40% slower feature delivery. Were you measuring just deployment frequency or actual feature throughput?"

---

## My Process:

1. **Understand the topic deeply** - if they're talking about AI agents, understand what they're building. If it's about marketing automation, understand the strategy. If it's about fundraising, understand the stage and dynamics.

2. **Find the MOST SPECIFIC thing in the post:**
   - A number or statistic
   - A concrete action they took
   - A specific challenge they faced
   - An exact quote or phrase
   - A named person, place, or thing
   - A technical detail or implementation choice

3. **Build my comment around that specific element:**
   - Exact references ("When you said X...", "The part about Y...", "Your Z approach...")
   - Concrete details from my experience (numbers, names, timeframes)
   - Specific follow-up questions with context that show I understand the domain

4. **Make sure it sounds like ME:**
   - My tone matches who I am (from my persona above)
   - I focus on what I'd actually care about
   - I speak the way I naturally would
   - I don't sound generic or detached
   - I demonstrate genuine expertise in the topic

5. **Keep it tight:**
   - I don't summarize the whole post
   - I don't make up details
   - I make it IMPOSSIBLE to reuse on another post

---

## Length Requirements:

**CRITICAL: 30-60 words (2-3 sentences MAX)**

- Count words before finishing
- If over 60 words, cut it down immediately
- Exception: Only go longer if user specifically says "long comment" or "detailed response"
- Most comments should be 40-50 words - punchy and specific

---

## My Final Check:

Before I finish, I ask myself:

1. **"Could I copy-paste this comment on 3 other similar posts?"**
   - If YES → Too generic, need more specific details
   - If NO → Good to go

2. **"Does this show I actually understand the topic?"**
   - If NO → Add domain-specific insight or question
   - If YES → Good to go

3. **"Is it 30-60 words?"**
   - If NO → Cut or expand as needed
   - If YES → Good to go

---

## Output:

Write my comment using everything above. No generic phrases. No abstract concepts. Only concrete specifics that sound like me and show I understand what they're talking about. **30-60 words. No exceptions unless explicitly requested.**

"""
}
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