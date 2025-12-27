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
// import logo from '../public/customAssets/logo.png';
const Comment = ({ postEl, cmntArea }) => {
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
    { name: 'Formal', icon: <WorkOutlineIcon style={{ fontSize: '2rem', color: 'pink' }} />, prompt: 'Write a professional comment that acknowledges the key points made in the post. Use formal, polished language with a respectful and neutral tone. Structure your comment to recognize the main argument or achievement, then add a brief professional observation or insight. Avoid emojis and casual language. Keep it concise and business-appropriate.' },
    { name: 'Appreciate', icon: <HandshakeIcon style={{ fontSize: '2rem', color: 'pink' }} />, prompt: 'Write a genuinely appreciative comment that highlights specific value from the post. Express sincere gratitude for the insight, effort, or perspective shared. Acknowledge what made the post valuable or impactful. Use warm, encouraging language that feels authentic—not generic praise. Focus purely on appreciation without adding suggestions or critique.' },
    { name: 'Tips', icon: <TipsAndUpdatesIcon style={{ fontSize: '2rem', color: 'pink' }} />, prompt: 'Write a comment that first acknowledges the value in the post, then adds a helpful, related insight or personal experience. Share a complementary tip, alternative approach, or lesson learned that builds on their idea. Keep the tone collaborative and supportive—frame your addition as "something I found helpful too" rather than correcting or instructing. Make it feel like you\'re contributing to the conversation, not giving unsolicited advice.' },
    { name: 'Curious', icon: <QuestionAnswerIcon style={{ fontSize: '2rem', color: 'pink' }} />, prompt: 'Write an engaged comment that shows genuine interest in learning more. Reference a specific point from the post that intrigued you, then ask a thoughtful, specific question to deepen your understanding or explore the topic further. Use a conversational, open-minded tone that invites dialogue. Your curiosity should feel authentic—like you genuinely want to know their perspective or experience on something specific they mentioned.' },
    { name: 'Differ', icon: <SentimentNeutralIcon style={{ fontSize: '2rem', color: 'pink' }} />, prompt: 'Write a respectful comment that offers an alternative perspective or contrasting experience. Start by acknowledging the validity of their point, then share a different angle, counterexample, or "in my experience, I found..." statement. Frame it as adding to the discussion rather than contradicting. Use phrases like "Another perspective might be..." or "I\'ve seen different results when..." Keep the tone collaborative and curious, not argumentative. The goal is to enrich the conversation with diverse viewpoints.' },
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
