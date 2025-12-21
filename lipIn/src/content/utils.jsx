// import React from "react";
import { createRoot } from "react-dom/client";
import Comment from "../comment.jsx";
export  function CommentComponent(postEl) {
    // If this post already has our mounted UI, don't add again
    if (postEl.querySelector('.lipin-comment-panel') || postEl.querySelector('[data-lipin-comment-root]')) return;
        
        const panelInput = document.createElement('div');
        panelInput.className = 'lipin-comment-panel';
        panelInput.setAttribute('data-lipin-comment-root', 'true');
        postEl.appendChild(panelInput);
        // Mount React component
        const root = createRoot(panelInput);
        // Pass the post element to the Comment component so it can read context (e.g., post description)
        root.render(<Comment postEl={postEl} />);
        // let actionBar = postEl.querySelector('.feed-shared-social-action-bar.feed-shared-social-action-bar--full-width.feed-shared-social-action-bar--has-social-counts')?.parentElement;

}
export function getPostDescription(postEl) {
    const testId = postEl.querySelector('[data-test-id="post-content"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[class*="update-components-text"]');
    if (classic) return classic.innerText.trim();
    return "";

}