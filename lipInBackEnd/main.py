from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()
app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API"))

class CommentsBody(BaseModel):
    post: str
    prompt: str | None = None #Optional field with a default value of None
    tone: str | None = None #Optional field with a default value of None

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
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates engaging LinkedIn comments."},
                {"role": "user", "content": f"""
                You are an expert LinkedIn communication assistant who writes concise, thoughtful, and human-sounding comments.

TASK:
Analyze the LinkedIn post provided and generate a comment that strictly follows:
1) the intent/style defined in {prompt}
2) the tone defined in {tone}

The comment must clearly reflect the action requested in {prompt}
(e.g., asking a clarifying question, adding an insight, or respectfully challenging an idea).

REQUIREMENTS:
- Length: 2–3 short lines only
- Writing style: natural, humble, and curious when appropriate
- Avoid generic phrasing or excessive enthusiasm
- Do NOT use clichés such as “Great post!” or “Thanks for sharing”
- Reference at least one relevant point from the LinkedIn post
- If the comment includes a question, begin with a brief appreciation
- Use no emojis unless emojis appear in the original post
- Ensure the tone aligns precisely with {tone}

INPUTS:
- {post}: the LinkedIn post content
- {prompt}: the specific instruction defining the comment’s intent or style
- {tone}: the specific tone for the comment

OUTPUT:
Write only the final comment (no explanations, no titles, no quotes)."""}
            ],
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )
        comment = response.choices[0].message.content.strip()
        print("prompt:", prompt)
        print("tone:", tone)
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


if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))