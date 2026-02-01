;
import React, { useRef, useState, useEffect } from 'react';
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
const Comment = ({ postEl, cmntArea, getCmntArea }) => {
  const [theme, setTheme] = useState("light");
  const [userCmntPrompt, setUserCmntPrompt] = useState('');
  const [cmntTool, setCmntTool] = useState(false);
  const [aiCmnt, setAiComnt] = useState('')
  const [activeToneIndex, setActiveToneIndex] = useState(null)
  const [tones, setTones] = useState(false)
  const [tonePrompt, setTonePrompt] = useState('')
  const lastInsertedComment = useRef('');
  const [loader, setLoader] = useState(false)
  const [url, setUrl] = useState("");
  const db = getFirestore(app)
  const isSaving = useRef(false);
  const [actualCmntArea, setActualCmntArea] = useState(cmntArea);
  const [cmntBtn,setCmntBtn] = useState(postEl?.querySelector('[data-view-name="comment-post"]'))

// Detect LinkedIn page theme (light/dark) and respond to changes
useEffect(() => {
    console.log('PostEl', postEl);
    console.log('CmntAre', cmntArea);
    console.log('getCmntArea', getCmntArea);
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


// Try to find the actual comment area if not provided or delayed in loading
useEffect(() => {
  if (!actualCmntArea && getCmntArea) {
    let attempts = 0;
    const maxAttempts = 20; 
    
    const checkForArea = () => {
      attempts++;
      const area = getCmntArea();
      
      if (area) {
        console.log('✅ Found comment area on attempt:', attempts);
        setActualCmntArea(area);
      } else if (attempts < maxAttempts) {
        setTimeout(checkForArea, 150);
      } else {
        console.log('❌ Failed to find comment area after', maxAttempts, 'attempts');
      }
    };
    checkForArea();
  }
}, [actualCmntArea, getCmntArea]);

// Handle loader state properly
useEffect(() => {
  if (loader && actualCmntArea) {
    actualCmntArea.textContent = "Generating comment...";
  }
}, [loader, actualCmntArea]);

// Get profile URL from storage
useEffect(() => {
  chrome.storage.local.get('profileURl', (result) => {
    if (result.profileURl) {
      const extractedUrl = result.profileURl.split("/in/")[1]?.split("/")[0];
      setUrl(extractedUrl);
    }
  });
}, []);

// Tries to listen directly on the comment button
useEffect(() => {
  if (!cmntBtn || !url) return;

  const handler = async (e) => {
    if (isSaving.current) {
      console.log('Already saving, skipping...');
      return;
    }
    
    console.log('✅ Comment button clicked - processing...');
    
    // Get current text from comment area (including any user edits)
    const text = actualCmntArea?.textContent || 
                actualCmntArea?.innerText || 
                lastInsertedComment.current;
    
    console.log('📝 Text from comment area at click time:', text);
    
    if (!text || text.trim() === '' || text === 'Generating comment...') {
      console.log('No valid text to save');
      return;
    }
    
    isSaving.current = true;
    console.log('🔥 Saving to Firebase...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateOnly = today.getTime();
      console.log(url,'profile slug');
      await addDoc(
        collection(db, "comments", url, "items"),
        {
          text: text.trim(),
          createdAt: dateOnly,
          timestamp: new Date().toISOString()
        }
      );
      
      console.log('🎉 Successfully saved to Firebase');
      lastInsertedComment.current = '';

    } catch (error) {
      console.error('❌ Firebase save error:', error);
    } finally {
      setTimeout(() => {
        isSaving.current = false;
      }, 1000);
    }
  };

  // Listen directly on the cmntBtn element
  cmntBtn.addEventListener('click', handler);
  return () => cmntBtn.removeEventListener('click', handler);
}, [cmntBtn, url, db, actualCmntArea]);

// Backup: Event delegation to catch comment button clicks
useEffect(() => {
  if (!url) return;
  
  const handleDocumentClick = async (e) => {
    const clickedElement = e.target.closest('button');
    if (!clickedElement) return;
    const dataViewName = clickedElement.getAttribute('data-view-name');
    if (dataViewName === 'comment-post') {
      console.log('🎯 Comment button clicked via delegation');
      
      // Check if this button is related to our post
      const isInOurPost = postEl?.contains(clickedElement);
      if (!isInOurPost) {
        console.log('Button not in our post, ignoring');
        return;
      }
      
      if (isSaving.current) {
        console.log('Already saving, skipping...');
        return;
      }
      
      // Get current text from comment area (including any user edits)
      const text = actualCmntArea?.textContent || 
                  actualCmntArea?.innerText || 
                  lastInsertedComment.current;      
      if (!text || text.trim() === '' || text === 'Generating comment...') {
        console.log('❌ No valid text to save');
        return;
      }
      
      isSaving.current = true;
      console.log('🔥 Saving to Firebase via delegation...');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = today.getTime();
        
        await addDoc(
          collection(db, "comments", url, "items"),
          {
            text: text.trim(),
            createdAt: dateOnly,
            timestamp: new Date().toISOString(),
          }
        );
        
        console.log('🎉 Successfully saved via delegation:', text.trim());
        lastInsertedComment.current = '';
        
      } catch (error) {
        console.error('❌ Delegation save error:', error);
      } finally {
        setTimeout(() => {
          isSaving.current = false;
        }, 1000);
      }
    }
  };
  
  document.addEventListener('click', handleDocumentClick, true);
  return () => document.removeEventListener('click', handleDocumentClick, true);
}, [url, actualCmntArea, db, postEl]);

// When comment text changes, insert into actual comment area
  useEffect(() => {
    if (aiCmnt && actualCmntArea && aiCmnt !== lastInsertedComment.current) {
      setLoader(false);
      actualCmntArea.textContent = aiCmnt;
      lastInsertedComment.current = aiCmnt;
      actualCmntArea.focus();
      try {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(actualCmntArea);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.log('Could not move cursor:', e);
      }
    }
  }, [aiCmnt, actualCmntArea]);

  // Genrate comments based on the post but before that it takes 3sec time to find the comment button
  const handleGenerateComment = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    setLoader(true);
    setCmntTool(false);
    
    // Check if postEl has the specific structure that doesn't need button finding
    const hasSpecificStructure = postEl?.classList?.contains('feed-shared-update-v2') && 
                                 postEl?.getAttribute('role') === 'article' && 
                                 postEl?.getAttribute('data-urn');
    
    if (hasSpecificStructure) {
      console.log('✅ PostEl has specific structure, generating comment directly without button search');
      // Generate comment directly without waiting for button
      const postContent = getPostDescription(postEl);
      if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        chrome.runtime.sendMessage({
          action: 'generateComment',
          text: `${postContent}\n${userCmntPrompt}\n${tonePrompt}`
        }, (res) => {
          if (chrome.runtime.lastError) {
            console.warn('chrome.runtime.lastError:', chrome.runtime.lastError);
            setLoader(false);
          } else {
            if (res && res.comments) {
              setAiComnt(res.comments);
            } else {
              setLoader(false);
            }
          }
        });
      } else {
        setLoader(false);
      }
      return; // Exit early, no need to search for button
    }
    
    // Original logic: wait 3 seconds to find the comment button
    setTimeout(() => {
      
      let foundBtn = null;
      // Strategy 1: Direct search in postEl
      foundBtn = postEl?.querySelector('[data-view-name="comment-post"]');
      console.log('Strategy 1 - Direct postEl search:', foundBtn);
      
      if (foundBtn) {
        setCmntBtn(foundBtn);
          const postContent = getPostDescription(postEl);
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
          chrome.runtime.sendMessage({
            action: 'generateComment',
            text: `${postContent}\n${userCmntPrompt}\n${tonePrompt}`
          }, (res) => {
            if (chrome.runtime.lastError) {
              console.warn('chrome.runtime.lastError:', chrome.runtime.lastError);
              setLoader(false);
            } else {
              if (res && res.comments) {
                setAiComnt(res.comments);
              } else {
                setLoader(false);
              }
            }
          });
        } else {
          setLoader(false);
        }
      } else {
        console.log('❌ Comment button not found after 3 seconds');
        setLoader(false);
      }
    }, 3000);
  };

// Tone options and prompts
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
  return (
  <div style={{ display: 'inline-block'}}>
      <button onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); 
        console.log('Main LipIn button clicked, toggling panel');
        setCmntBtn(postEl?.querySelector('[data-view-name="comment-post"]'))
        setCmntTool(!cmntTool)
      }} className="LipIn-comment-post-button" style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
        <img src={lipInLogo} alt="LipIn Logo" style={{ width: '2rem', height: '2rem', marginLeft: '5px' }} />
      </button>
    {cmntTool && <div className="LipIn-comment-container" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: '1rem', width: '500px', 
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', borderRadius: '20px', boxShadow: '0 4px 8px 0 rgba(255, 255, 255, 0.2), 0 6px 20px 0 rgba(255, 255, 255, 0.4)', zIndex: '1000' }}>
      <div style={{
        width: '100%',
        height: '50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        coor: 'white',
        paddingRight: '1rem'
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
      {tones && <div className='LipIn-comment-tones'>
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
    </div>}
  </div>
  );
}

export default Comment;

