import axios from 'axios';
import React,{useState, useEffect} from 'react'

function PostGen() {
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState([]) // Store full conversation (user + AI responses)
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [profileId, setProfileId] = useState('');
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
    setConversation(prev=>[...prev, inputValue])
    const userMessageHistory = conversation.filter((_, index)=> index%2 === 0);
    axios.post('https://lipin.onrender.com/askAIChats',{
        message: inputValue,  
        history: userMessageHistory,
        profile_url: profileId
    },{
        headers:{'Content-Type':'application/json'}
    }).then((res)=>{
        console.log("AI Response:", res.data.response);
        setConversation(prev=>[...prev, res.data.response]);
        setIsLoading(false);
    }).catch((err)=>{
        console.error("Error from backend:", err);
        setIsLoading(false);
    });
  }
  return (
    <div className='Post_generate_main' style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className='Post_generate_chat' style={{width:'58%', background:'white', height:'94vh', position:'relative',padding:'1rem', borderRadius:'1rem'}}>
            <div className='Post_generate_chat_view' style={{position:'absolute', top:'10px',width:'100%'}}>
                {conversation.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start', // User messages right, AI left
                        marginBottom: '1rem',
                        padding:'0.2rem'
                    }}>
                        <p style={{ 
                            fontSize: '12px', 
                            fontWeight: '500',
                            padding:'1rem',
                            borderRadius: index % 2 === 0 ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                            backgroundColor: index % 2 === 0 ? '#DCF8C6' : '#F1F0F0',
                            maxWidth: '60%'
                        }}>
                            {msg}
                        </p>
                    </div>
                ))}
            </div>
            <div className='Post_generate_input' style={{display:'flex', alignItems:'center', justifyContent:'space-evenly', position:'absolute', bottom:'10px',left:'0',width:'100%'}}>
                <textarea style={{outline:'none',width:'85%', height:'100px',backgroundColor:'#FCF9F9',border: 'none', borderRadius:'0.5rem', padding:'1rem'}} value={inputValue} onChange={(e)=> setInputValue(e.target.value)} placeholder='Ask AI for Post Ideas...' ></textarea>
                <div className='Post_generate_chat_addons' style={{display:'flex', flexDirection:'column',gap:'1rem', alignItems:'flex-end'}}>
                    <button>
                        Tone
                    </button>
                    <button>
                        Accent
                    </button>
                    <button>
                        Attach
                    </button>
                    <button onClick={handleAiContent}>
                        Submit
                    </button>
                </div>
            </div>
            
        </div>

        <div className='Post_generated_view' style={{width:'38%', background:'white', height:'100%',borderRadius:'1rem'}}>
            <div className='Post_template' style={{padding:'0.5rem'}}>
                <div className='Post_template_view' style={{width:'100%', backgroundColor:'#FCF9F9',height:'50vh', borderRadius:'0.5rem'}}>

                </div>
                <div className='Post_template_btns' style={{display:'flex', alignItems:'center', justifyContent:'space-evenly'}}>
                    <button>
                        Copy Content
                    </button>
                    <button>
                        See Draft
                    </button>
                </div>
            </div>
            <p style={{color:'#C8C8C8'}}>Drafts</p>
            <div className='Post_draft' style={{height:'37vh', overflow:'scroll', scrollbarWidth:'none'}}>

            </div>
        </div>
    </div>
  )
}

export default PostGen