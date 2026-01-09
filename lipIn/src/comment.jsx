;
import { useRef, useState, useEffect } from 'react';
import { getPostDescription } from './content/utils.jsx';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SendIcon from '@mui/icons-material/Send';
import {app}from './auth/firebase.jsx';
import { getFirestore, collection,
  getDocs,
  addDoc,
  query,
  limit } from "firebase/firestore";
// import logo from '../public/customAssets/logo.png';
const Comment = ({ postEl, cmntArea, cmntBtn }) => {
  const [theme, setTheme] = useState("light");
  const [userCmntPrompt, setUserCmntPrompt] = useState('');
  const [cmntTool, setCmntTool] = useState(false);
  const [aiCmnt, setAiComnt] = useState('')
  const [copyAlrt, setCoptAlrt] = useState(false)
  const [activeToneIndex, setActiveToneIndex] = useState(null)
  const [tones, setTones] = useState(false)
  const [tonePrompt, setTonePrompt] = useState('')
  const lastInsertedComment = useRef('');
  const [loader, setLoader] = useState(false)
  const [url, setUrl] = useState("");
  const db = getFirestore(app)
  const profileSlugRef = useRef(null);
const isSaving = useRef(false);

useEffect(() => {

    // Function to detect theme from the actual page
    const detectPageTheme = () => {
      // Method 1: Check LinkedIn's body background color
      const body = document.body;
      if (body) {
        const computedStyle = window.getComputedStyle(body);
        const bgColor = computedStyle.backgroundColor;
        
        // Parse RGB values
        const rgbMatch = bgColor.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0]);
          const g = parseInt(rgbMatch[1]);
          const b = parseInt(rgbMatch[2]);
          
          // Calculate luminance (perceived brightness)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          // If luminance is less than 0.5, it's likely dark mode
          return luminance < 0.5 ? "dark" : "light";
        }
      }
      
      // Method 2: Check for LinkedIn dark mode class/attribute
      if (body) {
        // LinkedIn uses data-theme or similar attributes
        const themeAttr = body.getAttribute('data-theme') || 
                         body.getAttribute('data-mode') ||
                         document.documentElement.getAttribute('data-theme') ||
                         document.documentElement.getAttribute('data-mode');
        if (themeAttr) {
          return themeAttr.toLowerCase().includes('dark') ? "dark" : "light";
        }
        
        // Check for dark mode classes
        if (body.classList.contains('dark') || 
            body.classList.contains('dark-mode') ||
            document.documentElement.classList.contains('dark') ||
            document.documentElement.classList.contains('dark-mode')) {
          return "dark";
        }
      }
      
      // Method 3: Fallback to system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      return mediaQuery.matches ? "dark" : "light";
    };

    // Wait a bit for page to load, then detect theme
    const detectTheme = () => {
      const detectedTheme = detectPageTheme();
      setTheme(detectedTheme);
    };

    // Initial detection with a small delay to ensure page is loaded
    const timeoutId = setTimeout(detectTheme, 100);
    
    // Also try immediately in case page is already loaded
    detectTheme();

    // Create a MutationObserver to watch for theme changes
    const observer = new MutationObserver(() => {
      detectTheme();
    });

    // Observe body and html for attribute/class changes
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-mode'],
        childList: false,
        subtree: false
      });
    }
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-mode'],
        childList: false,
        subtree: false
      });
    }

    // Also listen to system preference changes as backup
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const mediaListener = () => {
      // Re-detect from page first, fallback to system preference
      const pageTheme = detectPageTheme();
      if (pageTheme) {
        setTheme(pageTheme);
      } else {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", mediaListener);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      mediaQuery.removeEventListener("change", mediaListener);
    };
  }, []);
if (loader) {
  cmntArea.textContent = "Generating comment...";
}
useEffect(() => {
  chrome.storage.local.get('profileURl', (result) => {
    if (result.profileURl) {
      const extractedUrl = result.profileURl.split("/in/")[1]?.split("/")[0];
      setUrl(extractedUrl);
      console.log('Profile URL set:', extractedUrl); // Debug log
    }
  });
}, []);
useEffect(() => {
  const handler = async (e) => {
    if (e.target.closest('.LipIn-comment-container')) return;
    const commentButton = e.target.closest(cmntBtn);
    if (!commentButton) return;
      if (isSaving.current) {
      console.log('Already saving, skipping...');
      return;
    }
    console.log('btn clicked');
    const text = cmntArea?.textContent || cmntArea?.innerText || lastInsertedComment.current;
    
    if (!text) {
      console.log('No text to save');
      return;
    }
    
    if (!url) {
      console.log('No profile URL available');
      return;
    }
    isSaving.current = true; // Set flag

    try {
    const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateOnly = today.getTime();
      console.log('Attempting to save to Firebase:', { url, text });
      await addDoc(
        collection(db, "comments", url,"items"),
        {
          text,
          createdAt: dateOnly,
          source: "linkedin"
        }
      );
      console.log('Successfully saved to Firebase');
            lastInsertedComment.current = '';

    } catch (error) {
      console.error('Firebase save error:', error);
     } finally {
      // Reset flag after a short delay
      setTimeout(() => {
        isSaving.current = false;
      }, 1000);
    }
    
  };

  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, [url, db, cmntBtn]);

  useEffect(() => {
        
    if (aiCmnt && cmntArea && aiCmnt !== lastInsertedComment.current) {
      // Method 1: Direct textContent (NO events fired)
      setLoader(false);
      cmntArea.textContent = aiCmnt;

      // Remember what we inserted
      lastInsertedComment.current = aiCmnt;

      // Focus (safe)
      cmntArea.focus();

      // Move cursor to end (safe)
      try {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(cmntArea);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.log('Could not move cursor:', e);
      }

      // DO NOT dispatch any events - this causes auto-posting
      // cmntArea.dispatchEvent(new Event('input', { bubbles: true })); // ❌ NO!
    }

  }, [aiCmnt, cmntArea]);
  const handleGenerateComment = () => {
    setLoader(true);
    const postContent = getPostDescription(postEl);

    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
      chrome.runtime.sendMessage({
        action: 'generateComment',
        text: `${postContent}\n${userCmntPrompt}\n${tonePrompt}`
      }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn('chrome.runtime.lastError:', chrome.runtime.lastError);
        }
        setAiComnt(res.comments);
        
      });
    } else {
      console.error('No extension runtime available to send message.');
    }
    setCmntTool(false);

  };
  const tonesList = [
    { name: 'Formal', 
      icon: <WorkOutlineIcon style={{ fontSize: '2rem', color: 'pink' }} />,
      prompt: `Goal: Establish professional credibility and demonstrate expertise
              Rules:
              Use professional language and industry terminology
              Maintain respectful and courteous tone throughout
              Avoid slang, emojis, and casual expressions
              Structure comments with clear, complete sentences
              Reference specific points from the post with precision
              Must be factual and substantive, never superficial or generic
              Keep length between 2-4 sentences (30-60 words)` 
            },
          { 
      name: 'Appreciate', 
      icon: <HandshakeIcon style={{ fontSize: '2rem', color: 'pink' }} />, 
      prompt: `Goal: Express genuine gratitude and acknowledge the value provided
                Rules:

                Begin with sincere appreciation or acknowledgment
                Highlight specific aspects that resonated with you
                Share how the content impacted you personally
                Express gratitude for their effort and contribution
                Keep tone warm but authentic, avoid excessive flattery
                Must be factual and substantive, never superficial or generic
                Keep length between 2-4 sentences (30-60 words)`
       },
    { 
  name: 'Add Value', 
  icon: <TipsAndUpdatesIcon style={{ fontSize: '2rem', color: 'pink' }} />, 
  prompt: `You are writing as the commenter themselves — not about them, AS them.

Write a comment that adds genuine value by sharing a lived experience, specific insight, or practical lesson that builds on the post.

STRICT RULES:
- Write in first person. You ARE the person commenting.
- NO generic advice like "communication is key" or "consistency matters"
- NO phrases: "great post," "thanks for sharing," "I agree," "this resonates," "this is important"
- NO teaching tone or educational content
- NO promotional language or thought leadership posturing

WHAT TO DO:
- Reference something SPECIFIC from the post (a detail, claim, or example)
- Share a real moment from your experience: something you tried, failed at, discovered, or learned the hard way
- Make it concrete: actual tactics, specific numbers, real outcomes, or honest mistakes
- Keep it conversational and grounded — like you're talking to a colleague
- 2-4 sentences unless the story demands more

EXAMPLES OF GOOD "ADD VALUE" COMMENTS:

✓ "The part about async standups hit home. We tried daily Slack check-ins last year and everyone ignored them until we added a 2-question format with a 5-minute response window. Participation went from 40% to 95% in two weeks."

✓ "I made this exact mistake with our pricing page. Added five features to the comparison table thinking it would help, and our trial signups dropped 18%. Turned out people just wanted to see the price and one clear differentiator."

✓ "Your point about code reviews reminded me of when I spent 3 hours reviewing a PR that should've been 3 separate commits. Now I just reject anything over 300 lines and our review time dropped by half."

EXAMPLES OF BAD "ADD VALUE" COMMENTS (NEVER DO THIS):

✗ "Great insights! I would add that clear communication and setting expectations early are really important for team alignment."

✗ "This is so true! In my experience, consistency and discipline are the keys to success in any endeavor."

✗ "Love this perspective. I've found that staying curious and asking questions really helps build better relationships."

Write a comment that feels unmistakably personal — something only someone with this specific experience could write. No fluff, no filler, just real value.`
},
    { name: 'Curious', 
      icon: <QuestionAnswerIcon style={{ fontSize: '2rem', color: 'pink' }} />, 
      prompt: `Goal: Demonstrate genuine interest and invite deeper discussion
              Rules:

              Ask specific, thoughtful questions about the content
              Show you engaged with the material through informed queries
              Avoid questions that could be answered by reading the post
              Express interest in learning more about particular aspects
              Frame questions that encourage detailed responses
              Must be factual and substantive, never superficial or generic
              Keep length between 2-4 sentences (30-60 words)

              ` },
    { name: 'Differ', 
      icon: <SentimentNeutralIcon style={{ fontSize: '2rem', color: 'pink' }} />, 
    prompt: `
    Goal: Respectfully present alternative viewpoints or share contrasting experiences
    Rules:
        
    Acknowledge the validity of the original perspective first
    Use phrases like "In my experience" or "From a different angle"
    Present counterpoints with evidence or specific examples
    Maintain respectful and constructive tone throughout
    Avoid absolute statements or dismissive language
    Invite dialogue rather than declaring who is right
    Must be factual and substantive, never superficial or generic
    Keep length between 2-4 sentences (30-60 words)
    ` },
  ]


  const lipInLogo = chrome.runtime.getURL('customAssets/logo.png');
  // We call the background via chrome.runtime.sendMessage directly from the click handler below.
  return (<>
    <div style={{ display: 'flex', width: '100%', justifyContent: 'end' }}>
      <button onClick={(e) => {
        e.preventDefault();      // Prevent default button behavior
        e.stopPropagation(); setCmntTool(!cmntTool)
      }} className="LipIn-comment-post-button" style={{ background: 'transparent', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
        <img src={lipInLogo} alt="LipIn Logo" style={{ width: '2rem', height: '2rem', marginLeft: '5px' }} />
      </button>
    </div>
    {cmntTool && <div className="LipIn-comment-container" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: '1rem', width: '500px', top: '40px', 
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 8px 0 rgba(255, 255, 255, 0.2), 0 6px 20px 0 rgba(255, 255, 255, 0.4)', zIndex: '1000' }}>
      <div style={{
        width: '100%',
        height: '50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        coor: 'white',
        padding: '10px'
      }}
      >
        <input type="text" onChange={(e) => {
          setUserCmntPrompt(e.target.value)
        }} className="LipIn-comment-input-box" style={{
          width: '85%',
          height: '50px',
          borderRadius: '50px',
          padding: '1rem',
          outline: 'none',
          boxShadow: '0 4px 8px 0 rgba(228, 96, 146, 0.2), 0 6px 20px 0 rgba(228, 96, 146, 0.19)',
        }} placeholder="Ask LipIn to Comment" />
        <button className="LipIn-comment-post-button"
          style={{
            width: 'fit-content', background: 'transparent'
          }}
          onClick={handleGenerateComment}
        >
          <SendIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
        </button>
        <button onClick={(e) => {
          e.preventDefault();      // Prevent default button behavior
          e.stopPropagation(); setTones(!tones)
        }} className="LipIn-comment-custom-button" style={{ width: 'fit-content', background: 'transparent', }}>
          <AutoFixHighIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
        </button>

      </div>
      {tones && <div className='LipIn-comment-tones' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {tonesList.map((tone, index) => {
          const isActive = activeToneIndex === index;
          return (
            <button key={index} onClick={(e) => {
              e.preventDefault();      // Prevent default button behavior
              e.stopPropagation();
              setActiveToneIndex(index)
              setTonePrompt(tone.prompt)
            }
            } style={{ borderRadius: isActive ? '10px' : 'none', border: isActive ? '2px solid#E45A92' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
              {tone.icon}
              <p style={{ fontSize: 'small' }}>{tone.name}</p>
            </button>
          )
        })}
      </div>}
      {/* {aiCmnt && <div className='LipIn-comment-display' style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', padding: '1rem', gap: '1rem' }}>
                <p>
                    {aiCmnt}
                </p>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(aiCmnt).then(() => {
                            setCoptAlrt(true);
                            setTimeout(() => {
                                setCoptAlrt(false)
                            }, 4000)
                        })
                    }}
                >
                    {copyAlrt ? <DoneIcon fontSize='larger' style={{ fontSize: '2.5rem' }} color="success" /> : <ContentCopyIcon style={{ fontSize: '2.5rem' }} color='primary' />}
                </button>

            </div>} */}
    </div>}
  </>
  );
}

export default Comment;
