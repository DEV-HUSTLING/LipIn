chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('service_worker received message', message, sender);
  if (message && message.action === 'generateComment') {
    const [post, prompt, tone] = message.text.split("\\\n");
    console.log('generateComment prompt:', prompt);
    fetch('http://127.0.0.1:8000/AIcomments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({post: post, prompt: prompt, tone:tone})
        })
        .then(res=> res.json())
        .then(data=>{
            sendResponse({success: true,  comments: data.comment})
        })
        .catch(err=>{
            sendResponse({success:false, error: err.toString()})
        });
        return true;
  }
  return false;
});