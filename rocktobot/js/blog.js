// Blog functionality for rocktobot
// Tumblr API integration and post management

const TUMBLR_BLOG = 'rocktobot.tumblr.com';
const TUMBLR_API_KEY = 'ggJ1cSaUq6Vmng3JxnSRkqim8qQ99WiQKDjm7tBCW9MN7DIwSD';
const TUMBLR_API_BASE = `https://api.tumblr.com/v2/blog/${TUMBLR_BLOG}/posts`;

// Custom titles/metadata (can be manually added)
// Format: 'tumblr-post-id': { title: 'Custom Title', tags: ['tag1', 'tag2'] }
// Loaded from post-metadata.js
let postMetadata = typeof window !== 'undefined' ? window.postMetadata || {} : {};

// Fetch posts from Tumblr
async function fetchTumblrPosts(limit = 20, offset = 0) {
    try {
        const response = await fetch(
            `${TUMBLR_API_BASE}?api_key=${TUMBLR_API_KEY}&limit=${limit}&offset=${offset}&filter=text`
        );
        const data = await response.json();
        
        if (data.meta.status === 200 && data.response) {
            // Filter out reblogs
            const posts = data.response.posts.filter(post => !post.reblogged_from_name);
            return posts;
        }
        return [];
    } catch (error) {
        console.error('Error fetching Tumblr posts:', error);
        return [];
    }
}

// Format post date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Get post title (custom or default to date)
function getPostTitle(post) {
    const metadata = postMetadata[post.id_string];
    if (metadata && metadata.title) {
        return metadata.title;
    }
    return formatDate(post.timestamp);
}

// Get post tags (from metadata or Tumblr tags)
function getPostTags(post) {
    const metadata = postMetadata[post.id_string];
    if (metadata && metadata.tags) {
        return metadata.tags;
    }
    return post.tags || [];
}

// Parse Tumblr post content (handles text, images, links)
function parseTumblrContent(post) {
    let content = '';
    
    if (post.type === 'text') {
        content = post.body || '';
    } else if (post.type === 'photo') {
        // Handle photo posts
        if (post.caption) {
            content += post.caption;
        }
        if (post.photos && post.photos.length > 0) {
            post.photos.forEach(photo => {
                const imgUrl = photo.original_size.url;
                content += `<img src="${imgUrl}" alt="Post image" class="post-image" />`;
            });
        }
    } else if (post.type === 'quote') {
        content = `<blockquote>${post.text}</blockquote>`;
        if (post.source) {
            content += `<p class="quote-source">— ${post.source}</p>`;
        }
    } else if (post.type === 'link') {
        content = `<p><a href="${post.url}" target="_blank">${post.title || post.url}</a></p>`;
        if (post.description) {
            content += post.description;
        }
    } else if (post.type === 'video') {
        if (post.video_url) {
            content += `<video controls><source src="${post.video_url}" type="video/mp4"></video>`;
        }
        if (post.caption) {
            content += post.caption;
        }
    }
    
    return content;
}

// Fetch comments for a post
async function fetchPostComments(postId) {
    try {
        const response = await fetch(
            `${TUMBLR_API_BASE}/${postId}/notes?api_key=${TUMBLR_API_KEY}`
        );
        const data = await response.json();
        
        if (data.meta.status === 200 && data.response) {
            // Filter for comments only (replies)
            const comments = data.response.notes.filter(note => 
                note.type === 'reply' || note.type === 'comment'
            );
            return comments;
        }
        return [];
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
}

// Render a comment
function renderComment(comment) {
    const date = new Date(comment.timestamp * 1000);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const avatarUrl = comment.blog.avatar?.[0]?.url || '/assets/images/default-avatar.png';
    const blogName = comment.blog.name;
    const blogUrl = `https://${blogName}.tumblr.com`;
    
    return `
        <div class="comment">
            <div class="comment-avatar">
                <img src="${avatarUrl}" alt="${blogName}" />
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <a href="${blogUrl}" target="_blank" class="comment-author">${blogName}</a>
                    <time class="comment-date">${formattedDate}</time>
                </div>
                <div class="comment-text">${comment.content || ''}</div>
            </div>
        </div>
    `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchTumblrPosts,
        formatDate,
        getPostTitle,
        getPostTags,
        parseTumblrContent,
        fetchPostComments,
        renderComment
    };
}

