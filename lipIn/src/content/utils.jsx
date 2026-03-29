// import React from "react";
import { createRoot } from "react-dom/client";
import Comment from "../comment.jsx";
import CommentTracker from "../commentTracker.jsx";
export function CommentComponent(cmntEditor, postContainer) {
    console.log("Adding LipIn comment component to post:", cmntEditor);
    const cmntBox = postContainer.querySelector('[data-view-name="comment-box"]')
    const Area = cmntBox?.querySelector('[role="textbox"]')
    const cmntArea = Area?.querySelector('p')
    const cmntBtn = postContainer?.querySelector('[data-view-name="comment-post"]')
    const allCmntBtns = postContainer.querySelectorAll('button');
    if (postContainer.querySelector('.lipin-comment-panel') || postContainer.querySelector('[data-lipin-comment-root]')||postContainer.querySelector('.ai-comment-panel') || postContainer.querySelector('[data-lipin-comment-root]')) return;

    // Strategy 0: New LinkedIn UI (2025) — insert next to the emoji/photo buttons
    const emojiBtn = postContainer.querySelector('[aria-label="Show Emoji Picker"]');
    if (emojiBtn) {
        const buttonsRow = emojiBtn.parentElement;
        if (buttonsRow) {
            const panelInput = document.createElement('div');
            panelInput.className = 'lipin-comment-panel';
            panelInput.setAttribute('data-lipin-comment-root', 'true');
            panelInput.style.cssText = 'display: inline-flex; align-items: center;';
            buttonsRow.appendChild(panelInput);
            const root = createRoot(panelInput);
            const getCmntArea = () =>
                postContainer.querySelector('[aria-label="Text editor for creating comment"]') ||
                postContainer.querySelector('[contenteditable="true"]');
            root.render(<Comment postEl={postContainer} cmntArea={getCmntArea()} getCmntArea={getCmntArea} />);
            return true;
        }
    }

    // Check for alternative selector structure - Strategy 1
    let mainClass = postContainer?.querySelector('.display-flex.justify-space-between')?.querySelector('.display-flex');
    
    // Fallback to original selector - Strategy 2
    if (!mainClass) {
        mainClass = postContainer?.querySelector('.display-flex.flex-wrap')?.querySelector('.display-flex.justify-space-between')?.querySelector('.display-flex');
    }
    
    if (mainClass) {
        console.log("Found alternative structure, using mainClass approach");
        const Area = postContainer?.querySelector('.ql-editor.ql-blank') || postContainer?.querySelector('[contenteditable="true"]');
        const cmntArea = Area?.querySelector('p') || Area;
        const cmntBtn = 'button.comments-comment-box__submit-button--cr.artdeco-button.artdeco-button--1.artdeco-button--primary.ember-view';
        
        // If this post already has our mounted UI, don't add again
        if (postContainer.querySelector('.lipin-comment-panel') || postContainer.querySelector('[data-lipin-comment-root]')) return;
            
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
        
        // Create getCmntArea function for alternative structure
        const getCmntArea = () => {
            const area = postContainer?.querySelector('.ql-editor.ql-blank') || postContainer?.querySelector('[contenteditable="true"]');
            const p = area?.querySelector('p');
            if (p) {
                console.log('Found cmntArea using alternative structure');
                return p;
            }
            return area || null;
        };
        
        // Pass the post element to the Comment component so it can read context (e.g., post description)
        root.render(<Comment postEl={postContainer} cmntArea={cmntArea} getCmntArea={getCmntArea} />);
        return true;
    }
    
    if (allCmntBtns && allCmntBtns.length > 0) {
        const firstButtonParent = allCmntBtns[0].parentElement;
        const lipInContainer = document.createElement('div');
        lipInContainer.className = 'lipin-button-container';
        lipInContainer.style.cssText = `
            display: inline-block;
            margin-left: 8px;
            vertical-align: top;
        `;
        const panelInput = document.createElement('div');
        panelInput.className = 'lipin-comment-panel';
        panelInput.style.cssText = `
            display: inline-block;
        `;
        panelInput.setAttribute('data-lipin-comment-root', 'true');
        lipInContainer.appendChild(panelInput);
        firstButtonParent.parentElement.insertBefore(lipInContainer, firstButtonParent.nextSibling);
        
        const root = createRoot(panelInput);
            const getCmntArea = () => {
            const box = postContainer.querySelector('[data-view-name="comment-box"]');
            const area = box?.querySelector('[role="textbox"]');
            const p = area?.querySelector('p');
            if (p) {
                console.log('Found cmntArea using Strategy 1');
                return p;
            }            
            const editableArea = postContainer.querySelector('[contenteditable="true"]');
            if (editableArea) {
                return editableArea;
            }
            return null;
        };
        root.render(<Comment postEl={postContainer} cmntArea={cmntArea} getCmntArea={getCmntArea}/>);
        return true;
    } else {
        return false;
    }

}
export function getPostDescription(postEl) {
    const testId = postEl.querySelector('[data-view-name="feed-commentary"]')?postEl.querySelector('[data-view-name="feed-commentary"]'):postEl.querySelector('[data-test-id="post-content"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[data-testid="expandable-text-box"]')?postEl.querySelector('[data-testid="expandable-text-box"]'):postEl.querySelector('[class*="update-components-text"]');
    if (classic) return classic.innerText.trim();
    return "";

}
// export function getUserLink(classEle) {
//     // Check if CommentTracker is already added to prevent duplicates
//     if (classEle.querySelector('.lipin_user_comment_tracker')) return;
    
//     const comnt_panel = document.createElement('div');
//     comnt_panel.className = 'lipin_user_comment_tracker';
    
//     // Append to the entire sidebar container at the end
//     classEle.appendChild(comnt_panel);
    
//     const root = createRoot(comnt_panel);
//     // CommentTracker will get URL from localStorage
// }