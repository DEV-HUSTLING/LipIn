import axios from 'axios';
import React,{useState,useEffect} from 'react'
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
function AskAi({aiValue,setAskAI,profileId}) {
    const [inputValue, setInputValue] = useState('');
    const [conversation, setConversation] = useState([]) // Store full conversation (user + AI responses)
    const [isLoading, setIsLoading] = useState(false); // Loading state

    useEffect(()=>{
        setInputValue(aiValue);
    },[aiValue])
    
    const handleContentCreation=()=>{
        if (!inputValue.trim()) return; // Don't send empty messages
        
        console.log("Content to be created:", inputValue);
        const userMessageHistory = conversation.filter((_, index) => index % 2 === 0);
        
        // Add user message immediately and set loading
        setConversation(prev => [...prev, inputValue]);
        setIsLoading(true);
        setInputValue('');
        
        axios.post('http://127.0.0.1:8000/askAIChats', {
            message: inputValue,  
            history: userMessageHistory,
            profile_url: profileId
        }, {
            headers: {'Content-Type': 'application/json'}
        }).then((res) => {
            console.log("AI Response:", res.data.response);
            // Add AI response and stop loading
            setConversation(prev => [...prev, res.data.response]);
            setIsLoading(false);
        }).catch((err) => {
            console.error("Error from backend:", err);
            setConversation(prev => [...prev, "Sorry, there was an error processing your request."]);
            setIsLoading(false);
        });
    }

    return (
        <div style={{ background:'rgba(0,0,0,0.7)' ,position: 'absolute', width: '100vw', height: '100vh', left:0, right:0, top:0, botto:0 }} >
            <button onClick={()=>{setAskAI(false);}} style={{position:'absolute', top:'0', left:'0', background:'transparent', border:'none'}}>
                <HighlightOffIcon fontSize='large' color='white' />
            </button>
            <div style={{ height: '90vh', width: '50%', backgroundColor: 'white', boxShadow: '0 4px 8px 0 rgba(rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(rgba(246, 110, 165, 0.19)', position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', margin:'auto' ,borderRadius: '1rem', padding: '1rem', overflow: 'scroll', scrollbarWidth: 'none' }}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{height:'100%', padding:'1rem', width: '100%', overflowY: 'auto'}}>
                        {conversation.map((msg, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start', // User messages right, AI left
                                marginBottom: '1rem'
                            }}>
                                <p style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '500',
                                    padding:'1rem',
                                    borderRadius: index % 2 === 0 ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                                    outline:'none',
                                    boxShadow:'0 4px 8px 0 rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(246, 110, 165, 0.19)', 
                                    backgroundColor: index % 2 === 0 ? '#f0f8ff' : 'white',
                                    width:'fit-content',
                                    maxWidth: '70%',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.4'
                                }}>
                                    {msg}
                                </p>
                            </div>
                        ))}
                        {/* Loading indicator */}
                        {isLoading && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '500',
                                    padding:'1rem',
                                    borderRadius: '15px 15px 15px 5px',
                                    outline:'none',
                                    boxShadow:'0 4px 8px 0 rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(246, 110, 165, 0.19)', 
                                    backgroundColor: '#f0f0f0',
                                    width:'fit-content',
                                    fontStyle: 'italic',
                                    color: '#666'
                                }}>
                                    Typing...
                                </p>
                            </div>
                        )}
                    </div>
                    {/* Input Field */}
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', width:'100%'}}>
                        <input 
                            type='text' 
                            value={inputValue} 
                            onChange={(e)=>{setInputValue(e.target.value)}}
                            onKeyPress={(e) => e.key === 'Enter' && handleContentCreation()}
                            placeholder='Ask AI...'
                            style={{ border:'none', outline:'none' ,width:'80%', padding:'1rem', borderRadius:'15px', boxShadow:'0 4px 8px 0 rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(246, 110, 165, 0.19)' }} 
                        />
                        <button onClick={handleContentCreation} style={{ width: '10%', border:'none', background:'transparent' }}>Submit</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AskAi