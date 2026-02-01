import axios from 'axios';
import React,{useState, useEffect} from 'react'
import PostPreview from '../components/PostPreview.jsx';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
function PostGen() {
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState([]) // Store full conversation (user + AI responses)
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [profileId, setProfileId] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachPanelOpen, setAttachPanelOpen] = useState(false);
  useEffect(()=>{
    chrome.storage.local.get('profileURl',(result)=>{
        if (result.profileURl) {
                const extractedUrl = result.profileURl;
                const extractedProfileId = extractedUrl.split("/in/")[1]?.split("/")[0]
                setProfileId(extractedProfileId)
            } 
    })

  },[])
  const handleAiContent =()=>{
    if (!inputValue.trim()) return; // Don't submit empty messages
    
    setIsLoading(true);
    // Add user message to conversation first
    const userMessage = inputValue;
    setConversation(prev=>[...prev, userMessage]);
    setInputValue(''); // Clear input immediately
    
    const userMessageHistory = conversation.filter((_, index)=> index%2 === 0);
    const formData = new FormData();
    formData.append('profile_url', profileId || '');
    formData.append('prompt', userMessage);
    formData.append('tone', 'Professional, positive, conversational tone');
    formData.append('language', 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.');
    formData.append('history', JSON.stringify(userMessageHistory));
    if (Array.isArray(attachments)) {
        attachments.forEach((file) => {
            if (file instanceof File) {
                formData.append('attachments', file);
            }
        });
    }
    axios.post('http://127.0.0.1:8000/postGenerator', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(function (response) {
        setConversation(prev=>[...prev, response.data.response]);
        setIsLoading(false);
    })
    .catch(function (error) {
        console.error('Error:', error.response?.data || error);
        setConversation(prev=>[...prev, "Sorry, something went wrong. Please try again."]);
        setIsLoading(false);
    });
  }
  return (
    <div className='Post_generate_main' style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className='Post_generate_chat' style={{width:'58%', background:'white', height:'94vh', position:'relative',padding:'1rem', borderRadius:'1rem'}}>
            <div className='Post_generate_chat_view' style={{position:'absolute', top:'10px',width:'100%', left:'0',overflowY:'scroll', height:'80vh', scrollbarWidth:'none', padding:'1rem', boxSizing:'border-box'}}>
                {conversation.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start', // User messages right, AI left
                        marginBottom: '1rem',
                        padding:'0.2rem'
                    }}>
                        <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '500',
                            padding:'1rem',
                            borderRadius: index % 2 === 0 ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                            backgroundColor: index % 2 === 0 ? '#DCF8C6' : '#F1F0F0',
                            maxWidth: '60%'
                        }}>
                            <p>{msg}</p>
                            {index % 2 != 0&&<button style={{border:'none', background:'transparent', cursor:'pointer'}} onClick={()=>{
                                navigator.clipboard.writeText(msg);
                            }}>
                                <ContentCopyIcon fontSize='small' />
                            </button>}
                        </span>
                    </div>
                ))}
                {/* Show loading indicator when waiting for AI response */}
                {isLoading && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '1rem',
                        padding:'0.2rem'
                    }}>
                        <p style={{ 
                            fontSize: '12px', 
                            fontWeight: '500',
                            padding:'1rem',
                            borderRadius: '15px 15px 15px 5px',
                            backgroundColor: '#F1F0F0',
                            maxWidth: '60%'
                        }}>
                            Typing...
                        </p>
                    </div>
                )}
            </div>
            <div className='Post_generate_input' style={{display:'flex', alignItems:'center', justifyContent:'space-evenly', position:'absolute', bottom:'10px',left:'0',width:'100%'}}>
                <textarea 
                    style={{outline:'none',width:'85%', height:'100px',backgroundColor:'#FCF9F9',border: 'none', borderRadius:'0.5rem', padding:'1rem'}} 
                    value={inputValue} 
                    onChange={(e)=> setInputValue(e.target.value)} 
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAiContent();
                        }
                    }} 
                    placeholder='Ask AI for Post Ideas...'
                    disabled={isLoading}
                ></textarea>
                <div className='Post_generate_chat_addons' style={{display:'flex', flexDirection:'column',gap:'1rem', alignItems:'flex-end', position:'relative'}}>
                    <button>
                        Tone
                    </button>
                    <button>
                        Accent
                    </button>
                    <button onClick={()=>setAttachPanelOpen(!attachPanelOpen)}>
                        Attach
                    </button>
                    <button onClick={handleAiContent} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? 'Sending...' : 'Submit'}
                    </button>
                    {attachPanelOpen &&
                    <div className='Attachment_panel' style={{position:'absolute', bottom:'60px', right:'0', width:'200px', height:'150px', backgroundColor:'white', boxShadow:'0 4px 8px 0 rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(246, 110, 165, 0.19)', borderRadius:'1rem', padding:'1rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
                        <input type='file' multiple onChange={(e)=>{
                            const files = Array.from(e.target.files);
                            setAttachments(files);
                        }}/>
                    </div>
                    }
                </div>
            </div>
            
        </div>

        <div className='Post_generated_view' style={{width:'38%', background:'white', height:'100%',borderRadius:'1rem'}}>
            <div className='Post_template' style={{padding:'0.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
                <div className='Post_template_view' style={{width:'100%', height:'50vh', borderRadius:'0.5rem', border:'2px solid #f7f7f7'}}>
                    <PostPreview content={conversation.filter((_, index)=> index%2 !== 0).slice(-1)[0] || ""} />
                </div>
                <div className='Post_template_btns' style={{display:'flex', alignItems:'center', justifyContent:'space-evenly'}}>
                    <button style={{width:'40%', border:'none', height:'45px', borderRadius:'0.5rem'}}>
                        Copy Content
                    </button>
                    <button style={{width:'40%', border:'none', height:'45px', borderRadius:'0.5rem', backgroundColor:'#eb7ca8'}}>
                        See Draft
                    </button>
                </div>
            </div>
            <p style={{color:'#a3a3a3', fontSize:'1rem'}}>Drafts</p>
            <div className='Post_draft' style={{height:'33vh', overflow:'scroll', scrollbarWidth:'none', display:'flex', flexDirection:'column', gap:'1rem'}}>
                <div>
                    <p>01/22/26</p>
                    <div style={{width:'95%', paddingLeft:'10px',borderRadius:'1rem', backgroundColor:'#fdd4e4',display:'flex',justifyContent:'flex-start',alignItems:'center'}}>
                        <p>
                            Title: How AI is Revolutionizing Content Creation
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default PostGen