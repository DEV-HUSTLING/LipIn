import {CommentComponent, getUserLink} from'./utils.jsx'

function addIfNotExists(post,postContainer) {
    if (!post || !(post instanceof Element)) return;
    // Don't add twice — CommentComponent creates `.ai-comment-panel` and sets `data-lipin-comment-root`.
    if (post.querySelector('.ai-comment-panel') || post.querySelector('[data-lipin-comment-root]')) return;
    CommentComponent(post,postContainer);
    
}

function scanAndAddButtons() {
    // check the comment click
    document.addEventListener('click',function(e){
        const cmntBtn = e.target.closest('button.comment-button')
        
        if(cmntBtn){
            setTimeout(()=>{
                const postContainer = cmntBtn.closest('div.feed-shared-update-v2');
                if(postContainer){
                    const cmntEditor = postContainer.querySelector('.comments-comment-texteditor')
                    if(cmntEditor){
                        console.log('Comment editor found!')
                        addIfNotExists(cmntEditor,postContainer)
      
                    }else{
                        setTimeout(()=>{
                        const cmntEditor = postContainer.querySelector('.comments-comment-texteditor')
                        if(cmntEditor) addIfNotExists(cmntEditor,postContainer)
                        }, 800)
                    }

                }
            },300)
        }
    }, true)
    // const posts = document.querySelectorAll('div.comments-comment-texteditor');
    // posts.forEach(p => addIfNotExists(p));
}

function getProfileUrl(sidebar) {
  if (!sidebar) return;

  const stickyContent = sidebar.querySelector('.scaffold-layout__sticky-content');
  if (!stickyContent) return;

  const profileCard = stickyContent.querySelector('.artdeco-card.profile-card');
  if (!profileCard) return;

  const extract = () => {
    const link = profileCard.querySelector('a[href^="/in/"], a[href^="https://www.linkedin.com/in/"]');
    if (!link) return false;
    getUserLink(link,sidebar)
    chrome.runtime.sendMessage({
        action:'profileURL',
        profileURL:link.href
    })
    console.log('[LipIn] PROFILE URL:', link.href);
    return true;
  };
  if (extract()) return;
  const observer = new MutationObserver(() => {
    if (extract()) observer.disconnect();
  });

  observer.observe(profileCard, {
    childList: true,
    subtree: true
  });
}

// Observe DOM mutations so dynamically loaded posts also get the comment UI.
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;
            // If the added node is itself a post
            if (node.matches && node.matches('div.feed-shared-update-v2')) {
                addIfNotExists(node);
            } else {
                // Otherwise, check if new posts exist inside the added subtree
                const nested = node.querySelectorAll && node.querySelectorAll('div.feed-shared-update-v2');
                if (nested && nested.length) {
                    nested.forEach(n => addIfNotExists(n));
                }
            }
            if (!(node instanceof Element)) return;
            // If the added node is itself a post
            if (node.matches && node.matches('aside.scaffold-layout__sidebar')) {
                getProfileUrl(node);
            } else {
                // Otherwise, check if new posts exist inside the added subtree
                const nested = node.querySelectorAll && node.querySelectorAll('aside.scaffold-layout__sidebar');
                if (nested && nested.length) {
                    nested.forEach(n => getProfileUrl(n));
                }
            }
        });
        
    });
});

observer.observe(document.body, { childList: true, subtree: true });



// Initial scan for existing posts on page load
scanAndAddButtons();
document
  .querySelectorAll('aside.scaffold-layout__sidebar')
  .forEach(getProfileUrl);