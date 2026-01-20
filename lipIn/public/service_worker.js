chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'generateComment') {
    handleGenerateComment(message)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    
    return true; // Keep port open
  }
  if (message && message.action === 'profile'){
    // const profileID =  message;
    // console.log('service_worker profile message received', profileID);
    // // Send an acknowledgement back to the sender with the extracted profile identifier
    // try {
    //   // Keep the message channel open by returning true (below) because we
    //   // respond asynchronously after the fetch completes.
    //   fetch('http://127.0.0.1:8000/AIprofile_scrapper',{ 
    //     method:'POST',
    //     headers:{
    //       'Content-Type': 'application/json'
    //     },
    //     // FastAPI endpoint expects { "profile_url": "..." }
    //     body: JSON.stringify({profile_url: profileID.profile_url})
    //   })
    //   .then(res=> res.json())
    //   .then(data=>{
    //     // normalize response: backend may return { profile_url: '...' }
    //     console.log(data)
    //     sendResponse({ success: true, profile_url: data });
    //   })
    //   .catch(err => {
    //     sendResponse({ success: false, error: String(err) });
    //   });
    //   // IMPORTANT: return true to indicate we'll call sendResponse asynchronously
    //   return true;
    // } catch (err) {
    //   console.error('service_worker error responding to profile message', err);
    // }
  }
  if (message && message.action === 'askAIChat') {
    console.log('askAIChat message received:', message);
    handleAskAIChats(message)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({success: false, error: err.toString()}));
    return true;
  }
 if (message && message.action === 'triggerGetProfileURL') {
    // Get the active tab and send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'executeGetProfileURL' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Successfully triggered getProfileURL in content script');
            sendResponse({ success: true, response: response });
          }
        });
      } else {
        console.log('Not on LinkedIn page, cannot execute getProfileURL');
        sendResponse({ success: false, error: 'Not on LinkedIn page' });
      }
    });

    return true; // Keep port open for async response
  }

});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'openDashboard') {
    chrome.tabs.create({
      url: chrome.runtime.getURL("landingPage.html")
    })
    
    return true; // Keep port open
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
  if(message&&message.action === 'profileURL'){
    chrome.storage.local.set({profileURl: message.profileURL})
  }

})

async function handleGenerateComment(message) {
  const result = await chrome.storage.local.get(['persona']);
  const persona = result.persona;
  const result_2 = await chrome.storage.local.get(['language'])
  const language = result_2.language
  const [post, prompt, tone] = message.text.split("\\\n");
  console.log('generateComment prompt:', prompt);
  
  // const response = await fetch('https://lipin.onrender.com/AIcomments', {
  const response = await fetch('http://127.0.0.1:8000/AIcomments', {

    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      post: post, 
      prompt: prompt, 
      tone: tone, 
      persona: persona || 'Industry Expert',
      language: language
    })
  });
  
  const data = await response.json();
  return { success: true, comments: data.comment };
}

async function handleAskAIChats(message){
  try {
    // Validate input
    if (!message.text || typeof message.text !== 'string') {
      console.error('Invalid message.text:', message.text);
      throw new Error('Invalid or missing text field in message');
    }
    
    // Extract only the text and history, not the whole message object
    const textContent = message.text;
    const historyContent = Array.isArray(message.history) ? message.history : [];
    
    const requestBody = {
      message: textContent,  // Send only the text string
      history: historyContent  // Send only the history array
    };
    
    console.log('Sending request body to backend:', requestBody); // Debug log
    
    const response = await fetch('http://127.0.0.1:8000/askAIChats',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Backend response:', data); // Debug log
    return { success: true, response: data.response };
  } catch (error) {
    console.error('Error in handleAskAIChats:', error);
    throw error;
  }
}