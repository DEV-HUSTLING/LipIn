class SSIImageProcessing:
    def __init__(self, image_file):
        self.image_file = image_file
    def generate_prompt(self):
        return {
                            "role": "user",
                            "content": [
                            {"type": "text", "text": 
                             """
                             Goal: Extract key information from the provided LinkedIn SSI score image. 
                             
                             Task: Identify and return the following details in a structured format:
                                - SSI Score: The overall Social Selling Index score.
                                - Industry and Network Ranks: The ranks within the user's industry and network.
                                - Components of Score: Four components are listed with their corresponding scores: Four components are
                                    1. Establish your professional brand
                                    2. Find the right people
                                    3. Engage with insights
                                    4. Build strong relationships
                                - Comparative Data: Any comparative information provided, such as percentiles or averages.
                             Instructions:
                                - Analyze the image carefully to extract the required information.
                                - Return the information in a clear, structured format (e.g., JSON).
                                - If any information is missing or unclear, indicate that in the output.
                                Output Format: 
                                - No narrative text, only structured data.
                                - No additional explanations.
                                - Below format is just an example, do not copy the example values just follow the format.
                                - Strictly follow the below Example JSON format for your response:
                                {
                    "SSI_Score": <extract actual number>,
                    "Industry_Rank": "<extract actual percentage text>",
                    "Network_Rank": "<extract actual percentage text>", 
                    "Components": {
                        "Establish_your_professional_brand": <extract actual number>,
                        "Find_the_right_people": <extract actual number>,
                        "Engage_with_insights": <extract actual number>,
                        "Build_strong_relationships": <extract actual number>
                    },
                    "Comparative_Data": {
                        "Industry_Average_SSI": <extract actual number or "N/A">,
                        "Change_Status": "<extract actual text or N/A>"
                    }
                }
                             """},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                    "url": self.image_file
                                    }
                                }
                            ]
                        }
class SSIRecommendations:
    def __init__(self, ssi_data):
        self.ssi_data = ssi_data
    def generate_ssi_analysis(self):
        return f"""
                 Goal: Analyze the provided SSI component scores and generate specific, actionable recommendations to improve each component of the LinkedIn Social Selling Index.
                            Input: {self.ssi_data}
                            Input_Instruction: You will receive SSI data containing four component scores. Analyze each score and provide targeted recommendations based on the score ranges defined below.

                            Component Analysis Framework:

                            1. ESTABLISH YOUR PROFESSIONAL BRAND
                               Definition: This measures profile completeness, positioning clarity, and professional visibility on LinkedIn.

                               LinkedIn Algorithm Factors:
                               - Profile completeness (headline, about section, experience, skills, photo)
                               - Industry/role positioning specificity
                               - Content activity (posts, articles, featured section)
                               - Social proof (endorsements, recommendations, engagement)

                               Score Analysis Guide:
                               - 0-3: Profile is incomplete or invisible (missing critical sections)
                               - 4-7: Profile exists but lacks professional clarity or positioning
                               - 8-12: Profile is complete but under-positioned for target audience
                               - 13-18: Profile is well-positioned but needs amplification through activity
                               - 19-25: Strong profile; suggest minor optimizations only

                               Recommendation Focus: Profile optimization, content creation, positioning clarity

                            2. FIND THE RIGHT PEOPLE
                               Definition: This measures how effectively you discover and connect with relevant professionals in your target market or industry.

                               LinkedIn Algorithm Factors:
                               - Active use of LinkedIn search functionality
                               - Connection requests sent to relevant profiles
                               - Connection acceptance rate from target audience
                               - Network quality vs. quantity metrics

                               Score Analysis Guide:
                               - 0-3: No strategic networking behavior; passive connection building
                               - 4-7: Random networking or only accepting inbound requests
                               - 8-12: Some targeting but inconsistent connection strategy
                               - 13-18: Consistent niche-focused discovery and connection behavior
                               - 19-25: Highly strategic networking; suggest advanced optimization

                               Recommendation Focus: Search strategies, connection outreach, network targeting

                            3. ENGAGE WITH INSIGHTS
                               Definition: This measures the quality and consistency of your engagement with content in your professional sphere.

                               LinkedIn Algorithm Factors:
                               - Meaningful comments on relevant posts (not just likes)
                               - Early engagement with trending content in your niche
                               - Creating original insights through posts and replies
                               - Diverse engagement types (comments, saves, shares, reactions)

                               Score Analysis Guide:
                               - 0-3: Minimal or passive engagement; only likes or lurking behavior
                               - 4-7: Basic engagement with short comments or reactions only
                               - 8-12: Consistent engagement but lacks depth or insight
                               - 13-18: Regular thoughtful engagement that adds value
                               - 19-25: High-impact engagement; recognized as thought leader

                               Recommendation Focus: Comment strategies, content interaction timing, insight sharing

                            4. BUILD STRONG RELATIONSHIPS
                               Definition: This measures your ability to nurture and maintain ongoing professional relationships through repeated interactions.

                               LinkedIn Algorithm Factors:
                               - Follow-up messages after new connections
                               - Repeat interactions with the same professionals over time
                               - Direct messaging and conversation depth
                               - Consistent engagement with specific individuals' content

                               Score Analysis Guide:
                               - 0-3: Connections exist without meaningful interaction or follow-up
                               - 4-7: One-time interactions only; no relationship development
                               - 8-12: Occasional follow-ups but inconsistent relationship nurturing
                               - 13-18: Systematic relationship maintenance with regular touchpoints
                               - 19-25: Deep, trust-based relationships; suggest advanced strategies

                               Recommendation Focus: Follow-up sequences, relationship nurturing, ongoing engagement

                            Output Format Requirements:
                            - Return ONLY a JSON array of objects
                            - Each object represents one component with its recommendations
                            - No explanatory text, headers, or additional commentary
                            - Each recommendation must be specific, actionable, and measurable when possible

                            Required JSON Structure:
                            [
                              {{
                                "component": "Establish your professional brand",
                                "current_score": "[ACTUAL_SCORE_1]",
                                "recommendations": [
                                  "Specific actionable recommendation 1",
                                  "Specific actionable recommendation 2",
                                  "Specific actionable recommendation 3"
                                ]
                              }},
                              {{
                                "component": "Find the right people",
                                "current_score": "[ACTUAL_SCORE_2]",
                                "recommendations": [
                                  "Specific actionable recommendation 1",
                                  "Specific actionable recommendation 2",
                                  "Specific actionable recommendation 3"
                                ]
                              }},
                              {{
                                "component": "Engage with insights",
                                "current_score": "[ACTUAL_SCORE_3]",
                                "recommendations": [
                                  "Specific actionable recommendation 1",
                                  "Specific actionable recommendation 2",
                                  "Specific actionable recommendation 3"
                                ]
                              }},
                              {{
                                "component": "Build strong relationships",
                                "current_score": "[ACTUAL_SCORE_4]",
                                "recommendations": [
                                  "Specific actionable recommendation 1",
                                  "Specific actionable recommendation 2",
                                  "Specific actionable recommendation 3"
                                ]
                              }}
                            ]

                            Important: Provide 3-5 recommendations per component. Each recommendation should be specific, actionable, and directly address the score deficiency identified through the analysis framework above.
                            
                """
class Comments:
    def __init__(self, prompt, persona, tone, post, language):
        self.prompt = prompt
        self.persona = persona
        self.tone = tone
        self.post = post
        self.language = language
    def generate_prompt(self):
        return f"""
                ## About Me (User Persona)
                ${self.persona}

                ## The Post I'm Commenting On
                ${self.post}

                ## Tone I Want to Use
                ${self.tone}

                ## Language
                ${self.language}

                ## Specific Instructions
                ${self.prompt}

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