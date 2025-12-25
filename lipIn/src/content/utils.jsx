// import React from "react";
import { createRoot } from "react-dom/client";
import Comment from "../comment.jsx";
export  function CommentComponent(postEl,postContainer) {
        const mainClass = postEl?.querySelector('.display-flex.flex-wrap')?.querySelector('.display-flex.justify-space-between')?.querySelector('.display-flex')
        const Area = postEl?.querySelector('.ql-editor.ql-blank')
        const cmntArea = Area?.querySelector('p')

    // If this post already has our mounted UI, don't add again
    if (postEl.querySelector('.lipin-comment-panel') || postEl.querySelector('[data-lipin-comment-root]')) return;
        
        const panelInput = document.createElement('div');
        panelInput.className = 'lipin-comment-panel';
        panelInput.style.position = 'relative';
        panelInput.style.display = 'flex';
        panelInput.style.alignItems = 'center';
        panelInput.style.paddingInline = '0.5rem';

        panelInput.setAttribute('data-lipin-comment-root', 'true');
        mainClass?.appendChild(panelInput);
        // Mount React component
        const root = createRoot(panelInput);
        // Pass the post element to the Comment component so it can read context (e.g., post description)
        root.render(<Comment postEl={postContainer} cmntArea={cmntArea} />);
        // let actionBar = postEl.querySelector('.feed-shared-social-action-bar.feed-shared-social-action-bar--full-width.feed-shared-social-action-bar--has-social-counts')?.parentElement;

}
export function getPostDescription(postEl) {
    const testId = postEl.querySelector('[data-test-id="post-content"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[class*="update-components-text"]');
    if (classic) return classic.innerText.trim();
    return "";

}
export function getUserLink(postEl) {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
            chrome.runtime.sendMessage({ action: 'profile', profile_url:postEl.href },(res)=>{
                console.log(res);
            });
        }
    } catch (e) {
        // ignore messaging errors in content script context
    }

    return 0;

}