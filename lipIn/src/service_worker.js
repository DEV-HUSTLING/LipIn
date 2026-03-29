const API_BASE_URL = import.meta.env.VITE_API_URL;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'generateComment') {
    handleGenerateComment(message)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.toString() }));

    return true; // Keep port open
  }
  if (message && message.action === 'saveComment') {
    handleSaveComment(message)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    return true;
  }
  if (message && message.action === 'profile'){
    // const profileID =  message;
    // console.log('service_worker profile message received', profileID);
    // // Send an acknowledgement back to the sender with the extracted profile identifier
    // try {
    //   // Keep the message channel open by returning true (below) because we
    //   // respond asynchronously after the fetch completes.
    //   fetch(`${API_BASE_URL}/AIprofile_scrapper`,{
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
    // console.log('🔑 [SW] profileURL received, saving to storage:', message.profileURL);
    chrome.storage.local.set({profileURl: message.profileURL})
  }

})

async function handleSaveComment({ commentText, profileSlug }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const url = `https://firestore.googleapis.com/v1/projects/lipin-5ab71/databases/(default)/documents/comments/${profileSlug}/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        text: { stringValue: commentText },
        createdAt: { integerValue: String(today.getTime()) },
        timestamp: { stringValue: new Date().toISOString() }
      }
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore write failed (${res.status}): ${body}`);
  }
  console.log('✅ [SW] Comment saved to Firestore');
}

async function handleGenerateComment(message) {
  console.log('📥 [SW] handleGenerateComment received, raw text length:', message.text?.length);
  const result = await chrome.storage.local.get(['persona']);
  const persona = result.persona;
  const result_2 = await chrome.storage.local.get(['language']);
  const language = result_2.language;
  const [post, prompt, tone] = message.text.split("\\\n");
  console.log('📥 [SW] post snippet:', post?.substring(0, 80));
  console.log('📥 [SW] prompt:', prompt);
  console.log('📥 [SW] tone length:', tone?.length);
  console.log('📥 [SW] persona:', persona, '| language:', language);
  console.log('📤 [SW] Calling /AIcomments...');

  const response = await fetch(`${API_BASE_URL}/AIcomments`, {

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

  console.log('📥 [SW] /AIcomments response status:', response.status);
  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ [SW] /AIcomments error body:', errText);
    throw new Error(`/AIcomments failed (${response.status}): ${errText}`);
  }
  const data = await response.json();
  console.log('✅ [SW] /AIcomments data:', data);
  return { success: true, comments: data.comment };
}
