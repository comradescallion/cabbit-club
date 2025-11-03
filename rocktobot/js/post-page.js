// Individual post page functionality

let currentPostId = null;

// Helper functions (make available globally)
function getPostTitle(post) {
    const metadata = (typeof window !== 'undefined' && window.postMetadata) || postMetadata || {};
    if (metadata[post.id_string] && metadata[post.id_string].title) {
        return metadata[post.id_string].title;
    }
    return formatDate(post.timestamp);
}

function getPostTags(post) {
    const metadata = (typeof window !== 'undefined' && window.postMetadata) || postMetadata || {};
    if (metadata[post.id_string] && metadata[post.id_string].tags && Array.isArray(metadata[post.id_string].tags)) {
        return metadata[post.id_string].tags;
    }
    return (post.tags || []).map(tag => tag.startsWith('#') ? tag : `#${tag}`);
}

// Initialize post page
async function initPostPage() {
    // Get post ID from URL parameter or filename
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');
    
    // Fallback: try to get from filename
    if (!currentPostId) {
        const pathParts = window.location.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        currentPostId = filename.replace('.html', '');
    }
    
    if (!currentPostId) {
        const container = document.getElementById('post-content');
        if (container) {
            container.innerHTML = '<p>Post ID not found. Please provide a post ID in the URL.</p>';
        }
        return;
    }
    
    // Load and render post
    await loadAndRenderPost();
    
    // Load comments
    await loadAndRenderComments();
    
    // Setup email form
    setupEmailForm();
}

// Load and render post
async function loadAndRenderPost() {
    const container = document.getElementById('post-content');
    if (!container) return;
    
    // Try to load from cache or fetch from Tumblr
    const posts = await loadPosts();
    const post = posts.find(p => p.id_string === currentPostId);
    
    if (!post) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
    }
    
    const title = getPostTitle(post);
    const date = formatDate(post.timestamp);
    const tags = getPostTags(post);
    const content = parseTumblrContent(post);
    
    const tagsHtml = tags.map(tag => {
        const tagSlug = tag.toLowerCase().replace('#', '');
        return `<a href="/rocktobot/posts/?tag=${encodeURIComponent(tagSlug)}" class="tag">${tag}</a>`;
    }).join(' ');
    
    // Update page title
    document.title = `${title} — rocktobot`;
    
    container.innerHTML = `
        <article class="post-article">
            <header class="post-header">
                <h1>${title}</h1>
                <p class="post-meta">
                    <time datetime="${new Date(post.timestamp * 1000).toISOString()}">${date}</time>
                </p>
                ${tags.length > 0 ? `<div class="post-tags">${tagsHtml}</div>` : ''}
            </header>
            <div class="post-body">
                ${content}
            </div>
        </article>
    `;
}

// Load and render comments
async function loadAndRenderComments() {
    const container = document.getElementById('post-comments');
    if (!container) return;
    
    try {
        const comments = await fetchPostComments(currentPostId);
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet.</p>';
            return;
        }
        
        const commentsHtml = comments.map(comment => renderComment(comment)).join('');
        container.innerHTML = `
            <h2>Comments</h2>
            <div class="comments-list">
                ${commentsHtml}
            </div>
        `;
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p class="no-comments">Unable to load comments.</p>';
    }
}

// Setup email form
function setupEmailForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;
        const postTitle = document.querySelector('.post-header h1')?.textContent || 'Blog Post';
        
        // Create mailto link
        const email = 'kaistone@example.com'; // Replace with actual email
        const mailtoSubject = encodeURIComponent(subject || `Re: ${postTitle}`);
        const mailtoBody = encodeURIComponent(
            `Regarding: ${postTitle}\n\n${message}`
        );
        
        window.location.href = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;
    });
}

// Load posts helper (same as in posts-list.js)
async function loadPosts() {
    const cached = localStorage.getItem('tumblr-posts-cache');
    const cacheTime = localStorage.getItem('tumblr-posts-cache-time');
    
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
        return JSON.parse(cached);
    }
    
    if (typeof fetchTumblrPosts !== 'undefined') {
        const posts = await fetchTumblrPosts(50);
        localStorage.setItem('tumblr-posts-cache', JSON.stringify(posts));
        localStorage.setItem('tumblr-posts-cache-time', Date.now().toString());
        return posts;
    }
    
    return [];
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
} else {
    initPostPage();
}

