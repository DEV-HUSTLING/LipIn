<<<<<<< HEAD
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form, HTTPException, Query
=======
from typing import Optional
from fastapi import FastAPI, HTTPException
>>>>>>> main
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import List, Optional
import json
import logging
from prompts import Comments, SSIRecommendations, SSIImageProcessing, NicheRecommendation,NicheSpecificRecommendation
from helper import Image_Processor,Clean_JSON, File_to_Base64
load_dotenv()
app = FastAPI()
<<<<<<< HEAD
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)
=======
client = OpenAI()
>>>>>>> main

fireCred = credentials.Certificate(os.getenv("FIREBASE_API"))
firebase_admin.initialize_app(fireCred)
db = firestore.client()
class CommentsBody(BaseModel):
    
    post: str
    prompt: str | None = None #Optional field with a default value of None
    tone: str | None = None #Optional field with a default value of None
    persona: str | None = None #Optional field with a default value of None
    language: str | None = None #Optional field with a default value of None

class profileLink(BaseModel):
    profile_url: str
class nicheRecommend(BaseModel):
    profile_url: str
    niche: str
class PostBody(BaseModel):
    userReq: str
    # prompt: str
class GoogleSignInRequest(BaseModel):
    profileURL: str
class AskAIChat(BaseModel):
    message: str
    history: List[str] = []
    profile_url: Optional[str] = None
class GoogleSignInResponse(BaseModel):
    message: str
origins = [
    "http://localhost:3000",  # React default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",  # React default
    "https://lipin.onrender.com",
    "https://myfrontenddomain.com",
    "chrome-extension://*",   # Allow ALL Chrome extensions

]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],         
    allow_origin_regex=r"^chrome-extension://.*$",
)


@app.get("/")
async def welcome():
    return {"message":"Welcome to the FASTAPI"}


@app.get("/profileAnalysis") #SSI Score Extraction throiugh Image
async def get_personal_info(profile_url: str = Query(...)):
    documents = []
    
    try:
        # Validate profile_url is not empty
        if not profile_url or profile_url.strip() == "":
            raise HTTPException(400, "Profile URL cannot be empty")
        
        doc_ref = (
            db.collection("users")
            .document(profile_url.strip())  # Remove any whitespace
            .collection("personalInfo")
            .stream()
        )
    
        for d in doc_ref:
            documents.append(d.to_dict())
        for doc in documents:
            headline = doc.get("headline")
            currentExp = doc.get("currentExp")
            pastExp = doc.get("pastExperience")
            about = doc.get("userDescription")
            topic_files = doc.get("topicsFiles")
            topics=[]
            if topic_files:
                for topic in topic_files:
                    topics.append(topic)
            skills_files = doc.get("skillsFiles")
            skills = []
            if skills_files:
                for skill in skills_files:
                    skills.append(skill)
            career = doc.get("careerVision")

            ssi_files = doc.get("ssiScoreFiles")
            if ssi_files:
                for img in ssi_files:
                    image_type = "jpeg"
                    data_uri = f"data:image/{image_type};base64,{img["base64"]}"
                    ssi_image_extraction = SSIImageProcessing(data_uri)
                    ssi_img_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an AI assistant that will extract the key information like SSI score, individual component values, Industry and Network ranks, and comparitive data."},
                        
                        ssi_image_extraction.generate_prompt()
                        
                     ],
                    max_tokens=300
                    )
                # Clean responses using helper function
                ssi_cleaner = Clean_JSON(ssi_img_response.choices[0].message.content)
                cleaned_response = ssi_cleaner.clean_json_response()

                # Niche REcommendations
                niche_analysis_prompt = NicheRecommendation(career,headline,about,currentExp,skills,topics, pastExp)
                niche_analysis = client.chat.completions.create(
                    model = "gpt-4o-mini",
                    messages = niche_analysis_prompt.generate_niche_prompt(),
                    max_tokens = 800
                )
                niche_recomendation_cleaner = Clean_JSON(niche_analysis.choices[0].message.content)
                cleaned_niche_analysis = niche_recomendation_cleaner.clean_json_response() 
                # SSI Improvement Recommendations
                ssi_analysis_prompt = SSIRecommendations(cleaned_response) #Generate's SSI Improvement Recommendations
                ssi_analysis = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a LinkedIn SSI optimization agent focused to improve the user's SSI score based on the extracted data. Specifically, provide the recommedations to improve each of the four components of the SSI score."},
                        {
                            "role": "user",
                            "content": [
                            {"type": "text", "text": ssi_analysis_prompt.generate_ssi_analysis() },
                            ]
                        }
                     ],
                    max_tokens=800  # Increased for detailed recommendations
                    )
                ssi_analysis_cleaner = Clean_JSON(ssi_analysis.choices[0].message.content)
                cleaned_ssi_analysis = ssi_analysis_cleaner.clean_json_response()                
                try:
                    # Parse SSI data
                    parsed_data = json.loads(cleaned_response)
                except json.JSONDecodeError as e:
                    print(f"Error parsing SSI data: {e}")
                    print(f"Raw SSI response: {cleaned_response}")
                    # Return error with raw response for debugging
                    return {
                        "success": False,
                        "message": "Failed to parse SSI data",
                        "error": str(e),
                        "raw_ssi_response": cleaned_response
                    }
                try:
                    # Parse SSI data
                    parsed_nicheRecom_data = json.loads(cleaned_niche_analysis)
                except json.JSONDecodeError as e:
                    print(f"Error parsing SSI data: {e}")
                    print(f"Raw SSI response: {cleaned_niche_analysis}")
                    # Return error with raw response for debugging
                    return {
                        "success": False,
                        "message": "Failed to parse SSI data",
                        "error": str(e),
                        "raw_ssi_response": cleaned_niche_analysis
                    }
                try:
                    # Parse recommendations data
                    recommendations_data = json.loads(cleaned_ssi_analysis)
                except json.JSONDecodeError as e:
                    print(f"Error parsing recommendations: {e}")
                    print(f"Raw recommendations response: {cleaned_ssi_analysis}")
                    # Return SSI data without recommendations
                    return {
                        "success": True,
                        "message": "SSI data processed, but recommendations parsing failed",
                        "data": {
                            "ssi_data": parsed_data,
                            "recommendations": [],
                            "recommendations_error": str(e),
                            "raw_recommendations_response": cleaned_ssi_analysis
                        }
                    }
                
                # Combine both results
                combined_result = {
                    "ssi_data": parsed_data,
                    "ssi_recommendations": recommendations_data,
                    "niche_recommendations": parsed_nicheRecom_data

                }

        return {"success": True, "message": "Images processed successfully", "data": combined_result}
    
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(500, f"Error processing personal info: {str(e)}")

@app.post("/personalInfo") #Store User Personal Info
async def create_personal_info(
                            url: str = Form(...),
        email: str = Form(...),
        name: str = Form(...),
        userDescription: str = Form(...),
        purpose: str = Form(...),
        careerVision: str = Form(...),
        headline: str = Form(...),
        ssiScore:  Optional[List[UploadFile]] = File(None),
        profileFile:  Optional[List[UploadFile]] = File(None),
        resume:  Optional[List[UploadFile]] = File(None),
        currentExp: str = Form(...),
        topics: List[str] = Form([]),
        skills: List[str] = Form([]),
        pastExperience: str = Form(...),
                ):
    try:
        file_cvt = File_to_Base64()
        # Process ssiScore files
        ssiScore_list = []
        if ssiScore is not None:
            for file in ssiScore:
                if hasattr(file, 'filename') and file.filename:
                    # Fix the method call - pass the file as argument
                    print(f"Processing file: {file}")
                    converted_file = await file_cvt.file_to_base64(file)
                    ssiScore_list.append(converted_file)
        
        # Process profile files
        profileFile_list = []
        if profileFile is not None:
            for file in profileFile:
                if hasattr(file, 'filename') and file.filename:
                    profileFile_list.append(await file_cvt.file_to_base64(file))
        
        # Process resume files
        resume_list = []
        if resume is not None:
            for file in resume:
                if hasattr(file, 'filename') and file.filename:
                    resume_list.append(await file_cvt.file_to_base64(file))
        
        # Create data
        data = {
            "email": email,
            "name": name,
            "userDescription": userDescription,
            "purpose": purpose,
            "careerVision": careerVision,
            "headline": headline,
            "ssiScoreFiles": ssiScore_list,
            "profileFileAnalytics": profileFile_list,
            "resumeFiles": resume_list,
            "currentExp": currentExp,
            "topicsFiles": topics,
            "skillsFiles": skills,
            "pastExperience": pastExperience
        }
        
        # Save to Firestore
        _, doc_ref = db.collection("users").document(url).collection('personalInfo').add(data)
        
        return {
            "success": True,
            "message": "Personal information saved successfully",
            "document_id": doc_ref.id
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(500, str(e))

@app.post("/signin", response_model=GoogleSignInResponse)
async def google_sign_in(request: GoogleSignInRequest):
    try:
        doc_ref = (
            db.collection("users")
            .document(request.profileURL)
            .collection('personalInfo')
        )
        docs = list(doc_ref.limit(1).stream())
        
        user_exists = len(docs) > 0
        if user_exists:
            return GoogleSignInResponse(
                message="existing_user"
            )
        else:
            return GoogleSignInResponse(
                message="new_user"
            )

    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )

@app.post("/AIcomments")
def get_ai_comments(body: CommentsBody):
    post = body.post
    prompt = body.prompt if body.prompt else "Professional, positive, conversational comment"
    tone = body.tone if body.tone else "Professional, positive, conversational tone"
    persona = body.persona if body.persona else "Mid level professional with a focus on collaboration and innovation"
    language = body.language if body.language else 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.'
    commnets_input = Comments(prompt, persona, tone, post, language)
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI that writes authentic, high-quality LinkedIn comments that sound like they were written by a real professional—not generic or promotional."},
                {
                      "role": "user",
                      "content": commnets_input.generate_prompt()
            }
            ],
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )
        comment = response.choices[0].message.content.strip()
<<<<<<< HEAD
=======
        print("prompt:", prompt)
        print("comment:", comment)

>>>>>>> main
        return {"comment": comment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/askAIChats")
def get_ai_postsContent(body:AskAIChat ):
    userMsg = body.message
    history = body.history
    profile_url = body.profile_url
    print('user message:', userMsg)
    print('conversation history:', history)
    print('profile_url:', profile_url)
    
    # Initialize variables with default values
    headline = ""
    currentExp = ""
    pastExp = ""
    about = ""
    topics = []
    skills = []
    career = ""
    if profile_url:
        try:
            documents = []
            doc_ref = (
                db.collection("users")
                .document(profile_url.strip())
                .collection("personalInfo")
                .stream()
            )
            
            for d in doc_ref:
                documents.append(d.to_dict())
            
            # Extract user information if documents exist
            for doc in documents:
                headline = doc.get("headline", "")
                currentExp = doc.get("currentExp", "")
                pastExp = doc.get("pastExperience", "")
                about = doc.get("userDescription", "")
                career = doc.get("careerVision", "")
                topic_files = doc.get("topicsFiles", [])
                if topic_files:
                    for topic in topic_files:
                        topics.append(topic)
                skills_files = doc.get("skillsFiles", [])
                if skills_files:
                    for skill in skills_files:
                        skills.append(skill)
        except Exception as e:
            print(f"Error fetching user data: {e}")    
    try:
        # Build conversation messages with personalized system prompt
        system_content = f"""
        Role: You are a LinkedIn brand Content Creator. 
        Task: Assist users based on their request to improve their LinkedIn presence. Below is the background information of the user to help you provide better responses.
        
        Background Information of user:
        LinkedIn Headline: {headline}
        Current Experience: {currentExp}
        Past Experience: {pastExp}
        About: {about}
        User's topics of interest: {', '.join(topics)}
        User's skills: {', '.join(skills)}
        User's career vision: {career}
        
        Guidelines:
        1. Use the background information to tailor your responses to the user's professional profile and aspirations.
        2. Ensure that your responses align with LinkedIn's professional standards and best practices.
        3. Provide actionable advice that the user can implement to enhance their LinkedIn presence.
        4. Take the user background information into account while responding to the user's requests.
        5. Act as if you have user's personality, preferences, and style in mind while responding.
        """
        
        messages = [{"role": "system", "content": system_content}]
        
        # Add conversation history
        for i, msg in enumerate(history):
            if i % 2 == 0:  # Even indices are user messages
                messages.append({"role": "user", "content": msg})
            else:  # Odd indices are assistant responses
                messages.append({"role": "assistant", "content": msg})
        
        # Add current user message
        messages.append({"role": "user", "content": userMsg})
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=1000,
            n=1,
            stop=None,
            temperature=0.7,
        )
        aiResponse = response.choices[0].message.content.strip()
        print(aiResponse)
        return {"response": aiResponse}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nicheRecommendations")
def get_niche_recommendations(
    body: nicheRecommend
):
    try:
        documents = []
        doc_ref = (
            db.collection("users")
            .document(body.profile_url)
            .collection("personalInfo")
            .stream()
        )
        
        for d in doc_ref:
            documents.append(d.to_dict())
        
        # Extract user information if documents exist
        for doc in documents:
            headline = doc.get("headline", "")
            currentExp = doc.get("currentExp", "")
            pastExp = doc.get("pastExperience", "")
            about = doc.get("userDescription", "")
            career = doc.get("careerVision", "")
            topic_files = doc.get("topicsFiles", [])
            topics=[]
            if topic_files:
                for topic in topic_files:
                    topics.append(topic)
            skills_files = doc.get("skillsFiles", [])
            skills = []
            if skills_files:
                for skill in skills_files:
                    skills.append(skill)
        
        # Generate niche-specific SSI recommendations
        niche_analysis_prompt = NicheSpecificRecommendation(career,headline,about,currentExp,skills,topics, pastExp, body.niche)
        niche_analysis = client.chat.completions.create(
            model = "gpt-4o-mini",
            messages = niche_analysis_prompt.generate_ssi_recommendations(),
            max_tokens = 800
        )
        niche_recomendation_cleaner = Clean_JSON(niche_analysis.choices[0].message.content)
        cleaned_niche_analysis = niche_recomendation_cleaner.clean_json_response() 
        try:
            # Parse niche recommendations data
            recommendations_data = json.loads(cleaned_niche_analysis)
        except json.JSONDecodeError as e:
            print(f"Error parsing niche recommendations: {e}")
            print(f"Raw niche recommendations response: {cleaned_niche_analysis}")
            # Return error with raw response for debugging
            return {
                "success": False,
                "message": "Failed to parse niche recommendations",
                "error": str(e),
                "raw_niche_recommendations_response": cleaned_niche_analysis
            }
        
        return {"success": True, "message": "Niche recommendations generated successfully", "data": recommendations_data}
    
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(500, str(e))

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