;
import { useRef, useState, useEffect } from 'react';
import { getPostDescription } from './content/utils.jsx';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SendIcon from '@mui/icons-material/Send';
const Comment = ({ postEl, cmntArea }) => {
    const [userCmntPrompt, setUserCmntPrompt] = useState('');
    const [cmntTool, setCmntTool] = useState(false);
    const [aiCmnt, setAiComnt] = useState('')
    const [copyAlrt, setCoptAlrt] = useState(false)
    const [activeToneIndex, setActiveToneIndex] = useState(null)
        const [tones, setTones] = useState(false)
    const [tonePrompt, setTonePrompt] = useState('')
    const lastInsertedComment = useRef('');

 useEffect(() => {
        if (aiCmnt && cmntArea && aiCmnt !== lastInsertedComment.current) {
            console.log('Auto-inserting comment without events');
            
            // Method 1: Direct textContent (NO events fired)
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
        { name: 'Formal', icon: <WorkOutlineIcon style={{ fontSize: '2rem', color: 'white' }} />,   prompt: 'Write a professional comment that acknowledges the key points made in the post. Use formal, polished language with a respectful and neutral tone. Structure your comment to recognize the main argument or achievement, then add a brief professional observation or insight. Avoid emojis and casual language. Keep it concise and business-appropriate.' },
        { name: 'Appreciate', icon: <HandshakeIcon style={{ fontSize: '2rem', color: 'white' }} />,   prompt: 'Write a genuinely appreciative comment that highlights specific value from the post. Express sincere gratitude for the insight, effort, or perspective shared. Acknowledge what made the post valuable or impactful. Use warm, encouraging language that feels authentic—not generic praise. Focus purely on appreciation without adding suggestions or critique.'  },
        { name: 'Tips', icon: <TipsAndUpdatesIcon style={{ fontSize: '2rem', color: 'white' }} />,  prompt: 'Write a comment that first acknowledges the value in the post, then adds a helpful, related insight or personal experience. Share a complementary tip, alternative approach, or lesson learned that builds on their idea. Keep the tone collaborative and supportive—frame your addition as "something I found helpful too" rather than correcting or instructing. Make it feel like you\'re contributing to the conversation, not giving unsolicited advice.'  },
        { name: 'Curious', icon: <QuestionAnswerIcon style={{ fontSize: '2rem', color: 'white' }} />,   prompt: 'Write an engaged comment that shows genuine interest in learning more. Reference a specific point from the post that intrigued you, then ask a thoughtful, specific question to deepen your understanding or explore the topic further. Use a conversational, open-minded tone that invites dialogue. Your curiosity should feel authentic—like you genuinely want to know their perspective or experience on something specific they mentioned.' },
        { name: 'Differ', icon: <SentimentNeutralIcon style={{ fontSize: '2rem', color: 'white' }} />,  prompt: 'Write a respectful comment that offers an alternative perspective or contrasting experience. Start by acknowledging the validity of their point, then share a different angle, counterexample, or "in my experience, I found..." statement. Frame it as adding to the discussion rather than contradicting. Use phrases like "Another perspective might be..." or "I\'ve seen different results when..." Keep the tone collaborative and curious, not argumentative. The goal is to enrich the conversation with diverse viewpoints.' },
    ]



    // We call the background via chrome.runtime.sendMessage directly from the click handler below.
    return (<>
        <div style={{display:'flex', width:'100%', justifyContent:'end'}}>
            <button onClick={(e)=> {        e.preventDefault();      // Prevent default button behavior
        e.stopPropagation();  setCmntTool(!cmntTool)}} className="LipIn-comment-post-button" style={{background: 'transparent',  }}>
                <AutoFixHighIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
            </button>
        </div>
        {cmntTool && <div className="LipIn-comment-container" style={{ position:'absolute',display: 'flex', flexDirection: 'column', gap: '1rem',width:'500px', top:'40px', backgroundColor: '#1E1E1E', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 8px 0 rgba(228, 96, 146, 0.2), 0 6px 20px 0 rgba(228, 96, 146, 0.19)', zIndex:'1000' }}>
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
                <button onClick={(e)=>{ e.preventDefault();      // Prevent default button behavior
        e.stopPropagation();setTones(!tones)}} className="LipIn-comment-custom-button" style={{ width: 'fit-content', background: 'transparent', }}>
                    <AutoFixHighIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
                </button>

            </div>
            {tones &&<div className='LipIn-comment-tones' style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                {tonesList.map((tone, index) => {
                    const isActive = activeToneIndex === index;
                    return (
                        <button key={index} onClick={(e) =>{
                             e.preventDefault();      // Prevent default button behavior
                             e.stopPropagation();
                            setActiveToneIndex(index)
                            setTonePrompt(tone.prompt)}
                        } style={{ borderRadius: isActive ? '10px' : 'none', border: isActive ? '2px solid#E45A92' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
                            {tone.icon}
                            <p style={{fontSize:'small'}}>{tone.name}</p>
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
