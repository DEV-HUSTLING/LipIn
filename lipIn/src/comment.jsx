;
import { useRef, useState } from 'react';
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
const Comment = ({ postEl }) => {
    const [userCmntPrompt, setUserCmntPrompt] = useState('');
    const [aiCmnt, setAiComnt] = useState('')
    const [copyAlrt, setCoptAlrt] = useState(false)
    const [activeToneIndex, setActiveToneIndex] = useState(null)
    const tonesList = [
        { name: 'Formal', icon: <WorkOutlineIcon style={{ fontSize: '2rem', color: 'white' }} />, prompt:'Act as a professional comment writer. Write a formal and polished comment on the content below.Maintain a respectful, neutral, and professional tone. Avoid emojis, slang, and overly casual language.Keep the comment concise, clear, and well-structured.' },
        { name: 'Appreciate', icon: <HandshakeIcon style={{ fontSize: '2rem', color: 'white' }} />, prompt:'Write a positive and appreciative comment for the content below. Acknowledge the value, effort, or insight shared. Keep the tone warm, encouraging, and genuine. Do not add criticism or suggestions—focus only on appreciation.' },
        { name: 'Tips', icon: <TipsAndUpdatesIcon style={{ fontSize: '2rem', color: 'white' }} />,prompt:'Write a comment that starts by appreciating the content below, then adds a helpful tip, suggestion, or personal viewpoint. The tone should be supportive, constructive, and respectful. Make sure the advice feels optional, not authoritative.' },
        { name: 'Curious', icon: <QuestionAnswerIcon style={{ fontSize: '2rem', color: 'white' }} />, prompt:'Write an engaging and curious comment on the content below. Show interest in the idea and include one thoughtful question or reflective thought to encourage discussion. Keep the tone open-minded and conversational.' },
        { name: 'Differ', icon: <SentimentNeutralIcon style={{ fontSize: '2rem', color: 'white' }} />, prompt:'Write a comment that politely presents a different perspective on the content below. Keep the tone respectful, constructive, and positive. Avoid direct contradiction or negativity—frame the difference as an alternative viewpoint or personal experience.' },
    ]
    const [tones, setTones] = useState(false)
    const [tonePrompt, setTonePrompt] = useState('')
    // Resolve image URL at runtime so content scripts load the asset from the extension.
    const postBtnIcon = chrome.runtime.getURL('customAssets/btnIcon.png')
    const customBtnIcon = chrome.runtime.getURL('customAssets/edit.png')
    if (aiCmnt) {
        console.log('comment response', aiCmnt)
    }
    // We call the background via chrome.runtime.sendMessage directly from the click handler below.
    return (
        <div className="LipIn-comment-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    onClick={() => {
                        const postContent = getPostDescription(postEl);
                        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                            chrome.runtime.sendMessage({ action: 'generateComment', text: `${postContent}\\\n${userCmntPrompt}\\\n${tonePrompt}` }, (res) => {
                                if (chrome.runtime.lastError) {
                                    console.warn('chrome.runtime.lastError:', chrome.runtime.lastError);
                                }
                                setAiComnt(res.comments);
                            });
                        } else {
                            console.error('No extension runtime available to send message.');
                        }
                    }}
                >
                    <SendIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
                </button>
                <button onClick={()=>{setTones(!tones)}} className="LipIn-comment-custom-button" style={{ width: 'fit-content', background: 'transparent', }}>
                    <AutoFixHighIcon style={{ fontSize: '2.5rem', color: '#E45A92' }} />
                </button>

            </div>
            {tones &&<div className='LipIn-comment-tones' style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                {tonesList.map((tone, index) => {
                    const isActive = activeToneIndex === index;
                    return (
                        <button key={index} onClick={() =>{
                            setActiveToneIndex(index)
                            setTonePrompt(tone.prompt)}
                        } style={{ borderRadius: isActive ? '10px' : 'none', border: isActive ? '2px solid#E45A92' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
                            {tone.icon}
                            <p style={{fontSize:'small'}}>{tone.name}</p>
                        </button>
                    )
                })}
            </div>}
            {aiCmnt && <div className='LipIn-comment-display' style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', padding: '1rem', gap: '1rem' }}>
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

            </div>}
        </div>
    );
}

export default Comment;
