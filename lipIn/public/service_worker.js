chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'generateComment') {
    handleGenerateComment(message)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    
    return true; // Keep port open
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


async function handleGenerateComment(message) {
  const result = await chrome.storage.local.get(['persona']);
  const persona = result.persona;
  const result_2 = await chrome.storage.local.get(['language'])
  const language = result_2.language
  const [post, prompt, tone] = message.text.split("\\\n");
  console.log('generateComment prompt:', prompt);
  
  const response = await fetch('https://lipin.onrender.com/AIcomments', {
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
// if (message && message.action === 'profile'){
  //   const profileID =  message;
  //   console.log('service_worker profile message received', profileID);
  //   // Send an acknowledgement back to the sender with the extracted profile identifier
  //   try {
  //     // Keep the message channel open by returning true (below) because we
  //     // respond asynchronously after the fetch completes.
  //     fetch('http://127.0.0.1:8000/AIprofile_scrapper',{ 
  //       method:'POST',
  //       headers:{
  //         'Content-Type': 'application/json'
  //       },
  //       // FastAPI endpoint expects { "profile_url": "..." }
  //       body: JSON.stringify({profile_url: profileID.profile_url})
  //     })
  //     .then(res=> res.json())
  //     .then(data=>{
  //       // normalize response: backend may return { profile_url: '...' }
  //       sendResponse({ success: true, profile_url: data });
  //     })
  //     .catch(err => {
  //       sendResponse({ success: false, error: String(err) });
  //     });
  //     // IMPORTANT: return true to indicate we'll call sendResponse asynchronously
  //     return true;
  //   } catch (err) {
  //     console.error('service_worker error responding to profile message', err);
  //   }
  // }