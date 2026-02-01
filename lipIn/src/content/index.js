import './content.css'; // Import content-specific CSS
import { CommentComponent } from './utils.jsx'

function addIfNotExists(post, postContainer) {
    if (!post || !(post instanceof Element)) return;
    // Don't add twice — CommentComponent creates `.lipin-comment-panel` and sets `data-lipin-comment-root`.
    if (post.querySelector('.lipin-comment-panel') || post.querySelector('[data-lipin-comment-root]')||post.querySelector('.ai-comment-panel') || post.querySelector('[data-lipin-comment-root]')) return;
    CommentComponent(post, postContainer);

}

function scanAndAddButtons() {
    // check the comment click
    document.addEventListener('click', function (e) {
        console.log('Click detected on:', e.target);
        const cmntBtn = e.target.closest('[data-view-name="feed-comment-button"]')
        const cmntBtn2 = e.target.closest('button.comment-button')
        const cmntBtn3 = e.target.closest('button[aria-label*="comment"]')
        const cmntBtn4 = e.target.closest('.comments-comment-button')
        
        if (cmntBtn) {
            console.log('Comment button 1 clicked');
            setTimeout(() => {
                const postContainer = cmntBtn.closest('[componentKey*="MAIN_FEED_RELEVANCE"]');
                console.log('postContainer', postContainer)
                if (postContainer) {
                    const cmntEditor = postContainer.querySelector('[aria-label="Text editor for creating comment"]')
                    console.log('comment editor', cmntEditor)
                    if (cmntEditor) {
                        addIfNotExists(cmntEditor, postContainer)

                    } else {
                        setTimeout(() => {
                            const cmntEditor = postContainer.querySelector('[aria-label="Text editor for creating comment"]')
                            if (cmntEditor) addIfNotExists(cmntEditor, postContainer)
                        }, 800)
                    }

                }
            }, 300)
        }
        else if(cmntBtn2){
            console.log('Comment button 2 clicked');
             setTimeout(()=>{
                const postContainer = cmntBtn2.closest('div.feed-shared-update-v2');
                console.log('postContainer for cmntBtn2', postContainer);
                if(postContainer){
                    const cmntEditor = postContainer.querySelector('.comments-comment-texteditor')
                    console.log('cmntEditor found:', cmntEditor);
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
        else if(cmntBtn3){
            console.log('Comment button 3 clicked');
            setTimeout(()=>{
                const postContainer = cmntBtn3.closest('article') || cmntBtn3.closest('[data-urn]') || cmntBtn3.closest('.feed-shared-update-v2');
                console.log('postContainer for cmntBtn3', postContainer);
                if(postContainer){
                    // Try multiple selectors for comment editor
                    let cmntEditor = postContainer.querySelector('.comments-comment-texteditor') || 
                                   postContainer.querySelector('[contenteditable="true"]') ||
                                   postContainer.querySelector('.ql-editor') ||
                                   postContainer.querySelector('[aria-label*="comment"]');
                    console.log('cmntEditor found:', cmntEditor);
                    if(cmntEditor){
                        console.log('Comment editor found via button 3!')
                        addIfNotExists(cmntEditor, postContainer)
                    }else{
                        setTimeout(()=>{
                            cmntEditor = postContainer.querySelector('.comments-comment-texteditor') || 
                                       postContainer.querySelector('[contenteditable="true"]') ||
                                       postContainer.querySelector('.ql-editor') ||
                                       postContainer.querySelector('[aria-label*="comment"]');
                            if(cmntEditor) addIfNotExists(cmntEditor, postContainer)
                        }, 800)
                    }
                }
            }, 300)
        }
        else if(cmntBtn4){
            console.log('Comment button 4 clicked');
            setTimeout(()=>{
                const postContainer = cmntBtn4.closest('article') || cmntBtn4.closest('[data-urn]') || cmntBtn4.closest('.feed-shared-update-v2');
                console.log('postContainer for cmntBtn4', postContainer);
                if(postContainer){
                    let cmntEditor = postContainer.querySelector('.comments-comment-texteditor') || 
                                   postContainer.querySelector('[contenteditable="true"]') ||
                                   postContainer.querySelector('.ql-editor');
                    console.log('cmntEditor found:', cmntEditor);
                    if(cmntEditor){
                        console.log('Comment editor found via button 4!')
                        addIfNotExists(cmntEditor, postContainer)
                    }else{
                        setTimeout(()=>{
                            cmntEditor = postContainer.querySelector('.comments-comment-texteditor') || 
                                       postContainer.querySelector('[contenteditable="true"]') ||
                                       postContainer.querySelector('.ql-editor');
                            if(cmntEditor) addIfNotExists(cmntEditor, postContainer)
                        }, 800)
                    }
                }
            }, 300)
        }
    }, true)
    // const posts = document.querySelectorAll('div.comments-comment-texteditor');
    // posts.forEach(p => addIfNotExists(p));
}

function getProfileUrl(sidebar) {
    if (!sidebar) return;
    const profileLink = sidebar.querySelector('a[data-view-name="identity-self-profile"]');

    if (profileLink) {
        const extract = () => {
            const href = profileLink.href;
            if (
                !href ||
                (!href.startsWith('/in/') &&
                    !href.startsWith('https://www.linkedin.com/in/'))
            ) {
                return false;
            }

            const absoluteUrl = href.startsWith('/')
                ? `https://www.linkedin.com${href}`
                : href;

            // Save data
            chrome.storage.local.set({ profileURl: absoluteUrl }, () => {
                console.log('Saved to extension storage from profile link');
            });

            chrome.runtime.sendMessage({
                action: 'profileURL',
                profileURL: absoluteUrl,
            });
            return true;
        };

        if (extract()) return;

        // Fixed: observe the profileLink element, not undefined profileCard
        const observer = new MutationObserver(() => {
            if (extract()) observer.disconnect();
        });

        observer.observe(profileLink, {
            childList: true,
            subtree: true
        });
    } else {
        const stickyContent = sidebar.querySelector('.scaffold-layout__sticky-content');
        if (!stickyContent) return;
        const profileCard = stickyContent.querySelector('.artdeco-card.profile-card');
        const extract = () => {
            const link = profileCard.querySelector('a[href^="/in/"], a[href^="https://www.linkedin.com/in/"]');
            if (!link) return false;
            
            const absoluteUrl = link.href.startsWith('/')
                ? `https://www.linkedin.com${link.href}`
                : link.href;
            
            // Save data with correct key
            chrome.storage.local.set({ profileURl: absoluteUrl }, () => {
                console.log('Saved to extension storage from profile card');
            });
            
            chrome.runtime.sendMessage({
                action: 'profileURL',
                profileURL: absoluteUrl
            });
            
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
}


// Function to trigger profile URL extraction
function triggerGetProfileURL() {

    // Find all sidebar elements and execute getProfileUrl on them
    const sidebars = document.querySelectorAll('[role="main"]');

    if (sidebars.length > 0) {
        sidebars.forEach(sidebar => {
            getProfileUrl(sidebar);
        });
        return { success: true, message: `Executed getProfileUrl on ${sidebars.length} sidebar(s)` };
    } else {
        console.log('No sidebars found, will wait for them to load');
        const sidebar_2 = document.querySelectorAll('aside.scaffold-layout__sidebar')
        if (sidebar_2.length > 0) {
            sidebar_2.forEach(sidebar => {
                getProfileUrl(sidebar);
            });
            return { success: true, message: `Executed getProfileUrl on ${sidebar_2.length} scaffold sidebar(s)` };
        } else {
            return { success: false, message: 'No sidebars found at all' };
        }
        // If no sidebars found, wait for them to load
        // const observer = new MutationObserver((mutations) => {
        //     const newSidebars = document.querySelectorAll('[role="main"]');
        //     if (newSidebars.length > 0) {
        //         console.log('Sidebars loaded, executing getProfileUrl...');
        //         newSidebars.forEach(sidebar => getProfileUrl(sidebar));
        //         observer.disconnect();
        //     }
        // });

        // observer.observe(document.body, { childList: true, subtree: true });

        // // Timeout after 10 seconds
        // setTimeout(() => {
        //     observer.disconnect();
        //     console.log('Timeout waiting for sidebars');
        // }, 10000);

        // return { success: false, message: 'No sidebars found, waiting for page to load...' };
    }
}

// Message listener for popup trigger
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === 'executeGetProfileURL') {
        console.log('Content script received executeGetProfileURL message');

        const result = triggerGetProfileURL();
        sendResponse(result);

        return true; // Keep port open
    }
});


// Observe DOM mutations to detect new sidebars for profile URL extraction
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;

            // Only handle sidebar detection - don't add comment components to posts
            // Posts get comment components only when user clicks comment button

            // If the added node is itself a sidebar
            if (node.matches && node.matches('aside.scaffold-layout__sidebar')) {
                console.log('New sidebar detected, extracting profile URL...');
                getProfileUrl(node);
            } else {
                // Otherwise, check if new sidebars exist inside the added subtree
                const nested = node.querySelectorAll && node.querySelectorAll('[role="main"]');
                if (nested && nested.length) {
                    console.log('New sidebars detected in subtree, extracting profile URLs...');
                    nested.forEach(n => getProfileUrl(n));
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan when content script loads
console.log('Content script loaded, scanning for existing elements...');
scanAndAddButtons();

// Wait for page to be fully loaded before initial profile URL extraction
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, triggering initial profile URL extraction...');
        setTimeout(() => triggerGetProfileURL(), 1000); // Small delay to ensure LinkedIn has rendered
    });
} else {
    // Document already loaded
    console.log('Document already loaded, triggering initial profile URL extraction...');
    setTimeout(() => triggerGetProfileURL(), 1000);
}

// Also trigger on window load for extra safety
window.addEventListener('load', () => {
    console.log('Window loaded, triggering profile URL extraction...');
    setTimeout(() => triggerGetProfileURL(), 2000);
});