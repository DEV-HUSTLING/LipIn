// import React from "react";
import { createRoot } from "react-dom/client";
import Comment from "../comment.jsx";
import CommentTracker from "../commentTracker.jsx";
export function CommentComponent(postEl, postContainer) {
    console.log("Adding LipIn comment component to post:", postEl);
    const cmntBox = postEl.querySelector('[data-view-name="comment-box"]')
    const Area = cmntBox?.querySelector('[role="textbox"]')
    const cmntArea = Area?.querySelector('p')
    const cmntBtn = postEl?.querySelector('[data-view-name="comment-post"]')
    const allCmntBtns = postEl.querySelectorAll('button');
    if (postEl.querySelector('.lipin-comment-panel') || postEl.querySelector('[data-lipin-comment-root]') || postEl.querySelector('.lipin-button-container')) return;
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
            const box = postEl.querySelector('[data-view-name="comment-box"]');
            const area = box?.querySelector('[role="textbox"]');
            const p = area?.querySelector('p');
            if (p) {
                console.log('Found cmntArea using Strategy 1');
                return p;
            }            
            const editableArea = postEl.querySelector('[contenteditable="true"]');
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
    const testId = postEl.querySelector('[data-view-name="feed-commentary"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[data-testid="expandable-text-box"]');
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