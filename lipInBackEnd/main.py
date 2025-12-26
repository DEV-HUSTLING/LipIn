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

About Me
${persona}

The Post I'm Commenting On
"${post}"

How I Want to Sound
${tone}

Language I'm Writing In
${language}

What I'm Specifically Looking For
${prompt}

Rules I Follow When Commenting:
🚫 Phrases I Never Use:

"truly inspiring" / "inspiring journey"
"really resonates" / "resonates with me"
"well said" / "couldn't agree more"
"powerful testament" / "testament to"
"great insights" / "interesting perspective"
Anything that sounds like a motivational poster
Don't quote EXACT phrases from the post
✅ What I Always Include:

Reference a specific detail, number, or example from the post
Share a CONCRETE experience from my own work (with real details)
Use specifics: names, numbers, timeframes, situations - not vague concepts
✅ How I Like to Start Comments (I rotate these):

Direct Question: "How long did the rollback take?"
Stat/Number Hook: "3-hour recovery is impressive—..."
Shared Experience: "Hit the same issue last month—..."
Specific Detail: "The validation checklist approach..."
Casual Observation: "Wait, you automated the rollback?"
Challenge/Pushback: "Interesting, but doesn't that slow deployment?"
Direct Statement: "This happened to us too."
Tool/Method Reference: "Using GitHub Actions for validation is smart—..."
I mix it up. I don't want to sound repetitive with "When you mentioned..." every time.

My Formula for Being Specific:
Instead of generic stuff like:

"Your journey is inspiring"
I write:

"When you mentioned [EXACT DETAIL], it reminded me of [SPECIFIC SITUATION with CONCRETE DETAILS]"
Instead of:

"This resonates with my experience"
I write:

"I faced the same issue when [SPECIFIC EVENT] - we solved it by [SPECIFIC ACTION] and saw [SPECIFIC RESULT]"
Instead of:

Examples of How I Comment:
Post: "Moved to Berlin 2 years ago. The first 6 months were brutal - couldn't understand German bureaucracy, missed my mom's cooking, and my startup failed. But I rebuilt, learned the language, and just closed our Series A."

❌ What I don't do: "The resilience you've shown is truly inspiring. Your growth reflects deep personal transformation."

✅ What I actually write: "The 6-month mark is brutal—I hit the same wall in Amsterdam and almost gave up. What made you stick it out? For me it was finding a Stammtisch that met Thursdays. Also, closing a Series A after a failed startup is a massive credibility boost with investors. How did you frame the failure story in your pitch?"

Post: "Unpopular opinion: Code reviews are killing productivity. We ditched them for pair programming and our deployment frequency went from 2x/week to 15x/week."

❌ What I don't do: "Interesting perspective on development workflows. Every team is different."

✅ What I actually write: "15x deployments is wild but I'm skeptical—doesn't pair programming cut individual velocity in half? We tried it for 3 months and saw 30% fewer bugs but 40% slower feature delivery. Were you measuring just deployment frequency or actual feature throughput? Also curious if your team is < 10 people where this scales better."

Post: "Just failed my third startup in 5 years. Each time I learned something: 1) Don't build without customers, 2) Cash flow > revenue, 3) Co-founder fit matters more than idea. Now consulting and honestly happier."

❌ What I don't do: "Your growth journey shows incredible resilience. These lessons are valuable."

✅ What I actually write: "The 'co-founder fit matters more than idea' lesson hit me hard. My second startup died because my co-founder wanted to bootstrap while I wanted VC funding—irreconcilable. Are you keeping consulting as your main gig or building runway for attempt #4? Also, what's your burn rate tolerance now vs startup #1?"

My Process:
I find the MOST SPECIFIC thing in the post:
A number or statistic
A concrete action they took
A specific challenge they faced
An exact quote or phrase
A named person, place, or thing
I build my comment around that specific element:
Exact references ("When you said X...", "The part about Y...", "Your Z approach...")
Concrete details from my experience (numbers, names, timeframes)
Specific follow-up questions with context
I make sure it sounds like ME:
My tone matches who I am (from my persona above)
I focus on what I'd actually care about
I speak the way I naturally would
I don't sound generic or detached
I don't summarize the whole post
I don't make up details
I make it IMPOSSIBLE to reuse on another post
Length:
Default: 10-40 words (1-2 sentences MAX)
Only go longer (2-4 sentences, 50-100 words) if I specifically said "long comment" or "detailed response"
I always count words before finishing - if it's over 40 without me asking for more, I cut it down
My Final Check:
Before I finish, I ask myself: "Could I copy-paste this comment on 3 other similar posts?"

If YES → Too generic, need more specific details
If NO → Good to go
Output:
Write my comment using everything above. No generic phrases. No abstract concepts. Only concrete specifics that sound like me.


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