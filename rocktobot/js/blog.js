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
            // Filter out reblogs - check multiple indicators
            const posts = data.response.posts.filter(post => {
                // A post is a reblog if it has reblog information
                return !post.reblogged_from_name && !post.reblogged_root_name && !post.reblogged_from_id;
            });
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

// Get post title (custom metadata, Tumblr title, or default to date)
function getPostTitle(post) {
    const metadata = postMetadata[post.id_string];
    if (metadata && metadata.title) {
        return metadata.title;
    }
    // Check if Tumblr post has a title
    if (post.title) {
        return post.title;
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

// Process HTML content to ensure images and links work properly
function processTumblrHTML(html) {
    if (!html) return '';
    
    // If it's not already HTML (plain text), return as-is
    // Tumblr typically returns HTML for body/caption fields
    if (typeof html !== 'string') {
        return String(html);
    }
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process all images - ensure they have proper src and class
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
        // Make sure image URLs are absolute
        let src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src) {
            if (!src.startsWith('http')) {
                if (src.startsWith('//')) {
                    src = `https:${src}`;
                } else if (src.startsWith('/')) {
                    src = `https://www.tumblr.com${src}`;
                } else {
                    src = `https://${src}`;
                }
                img.setAttribute('src', src);
            }
            // Remove data-src if present
            if (img.hasAttribute('data-src')) {
                img.removeAttribute('data-src');
            }
        }
        // Add post-image class if not present
        if (!img.classList.contains('post-image')) {
            img.classList.add('post-image');
        }
        // Ensure alt text
        if (!img.getAttribute('alt')) {
            img.setAttribute('alt', 'Post image');
        }
        // Ensure images are displayed as block
        img.style.display = 'block';
    });
    
    // Process all links - ensure they open in new tab and have proper styling
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
            // Make URLs absolute if needed
            if (!href.startsWith('http')) {
                if (href.startsWith('//')) {
                    link.setAttribute('href', `https:${href}`);
                } else if (href.startsWith('/')) {
                    link.setAttribute('href', `https://www.tumblr.com${href}`);
                }
            }
            // Open external links in new tab
            const finalHref = link.getAttribute('href');
            if (finalHref && finalHref.startsWith('http')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        }
    });
    
    // Process all iframes (for embedded content)
    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.style.maxWidth = '100%';
        iframe.style.borderRadius = '8px';
    });
    
    return tempDiv.innerHTML;
}

// Parse Tumblr post content (handles text, images, links)
function parseTumblrContent(post) {
    let content = '';
    
    if (post.type === 'text') {
        // Text posts: body contains HTML with formatting
        content = post.body || '';
        
        // Process the HTML to ensure images and links work
        content = processTumblrHTML(content);
        
        // If text post has embedded photos (separate from body), add them
        if (post.photos && post.photos.length > 0) {
            post.photos.forEach(photo => {
                // Check if image is already in the body HTML
                const imgUrl = photo.original_size.url;
                if (!content.includes(imgUrl)) {
                    content += `<img src="${imgUrl}" alt="Post image" class="post-image" />`;
                }
            });
        }
    } else if (post.type === 'photo') {
        // Handle photo posts - photos first, then caption
        if (post.photos && post.photos.length > 0) {
            post.photos.forEach(photo => {
                const imgUrl = photo.original_size.url;
                content += `<img src="${imgUrl}" alt="Post image" class="post-image" />`;
            });
        }
        // Caption for photo posts is HTML
        if (post.caption) {
            content += processTumblrHTML(post.caption);
        }
    } else if (post.type === 'quote') {
        content = `<blockquote>${post.text || ''}</blockquote>`;
        if (post.source) {
            content += `<p class="quote-source">— ${post.source}</p>`;
        }
    } else if (post.type === 'link') {
        const linkUrl = post.url || '';
        const linkTitle = post.title || linkUrl;
        content = `<p><a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkTitle}</a></p>`;
        // Description is HTML
        if (post.description) {
            content += processTumblrHTML(post.description);
        }
    } else if (post.type === 'video') {
        // Video posts can have embedded player or video_url
        if (post.video_url) {
            content += `<video controls class="post-video"><source src="${post.video_url}" type="video/mp4"></video>`;
        } else if (post.player && post.player.length > 0) {
            // Use the player embed code
            const player = post.player.find(p => p.width === 500) || post.player[0];
            if (player && player.embed_code) {
                content += player.embed_code;
            }
        }
        // Caption is HTML
        if (post.caption) {
            content += processTumblrHTML(post.caption);
        }
    } else if (post.type === 'audio') {
        // Audio posts
        if (post.player) {
            content += post.player;
        }
        if (post.caption) {
            content += processTumblrHTML(post.caption);
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

