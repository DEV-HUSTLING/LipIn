import {CommentComponent} from'./utils.jsx'

function addIfNotExists(post) {
    if (!post || !(post instanceof Element)) return;
    // Don't add twice — CommentComponent creates `.ai-comment-panel` and sets `data-lipin-comment-root`.
    if (post.querySelector('.ai-comment-panel') || post.querySelector('[data-lipin-comment-root]')) return;
    CommentComponent(post);
}

function scanAndAddButtons() {
    const posts = document.querySelectorAll('div.feed-shared-update-v2');
    posts.forEach(p => addIfNotExists(p));
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
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan for existing posts on page load
scanAndAddButtons();
