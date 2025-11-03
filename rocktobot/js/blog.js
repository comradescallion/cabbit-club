// Blog functionality for rocktobot
// Tumblr API integration and post management - Reimplemented from scratch

const TUMBLR_BLOG = 'rocktobot.tumblr.com';
const TUMBLR_API_KEY = 'ggJ1cSaUq6Vmng3JxnSRkqim8qQ99WiQKDjm7tBCW9MN7DIwSD';
const TUMBLR_API_BASE = `https://api.tumblr.com/v2/blog/${TUMBLR_BLOG}/posts`;

// Custom titles/metadata (can be manually added)
let postMetadata = typeof window !== 'undefined' ? window.postMetadata || {} : {};

/**
 * Fetch posts from Tumblr API
 * Returns only original posts (no reblogs, no replies/comments)
 */
async function fetchTumblrPosts(limit = 50, offset = 0) {
    try {
        // Tumblr API returns HTML by default, no need for filter parameter
        // The API automatically excludes reblogs if we check the right fields
        const response = await fetch(
            `${TUMBLR_API_BASE}?api_key=${TUMBLR_API_KEY}&limit=${limit}&offset=${offset}`
        );
        
        if (!response.ok) {
            console.error('Tumblr API error:', response.status, response.statusText);
            return [];
        }
        
        const data = await response.json();
        
        if (data.meta && data.meta.status === 200 && data.response && data.response.posts) {
            // Filter out reblogs and replies/comments
            const originalPosts = data.response.posts.filter(post => {
                // Exclude reblogs - check all reblog indicators
                const isReblog = post.reblogged_from_name || 
                                post.reblogged_root_name || 
                                post.reblogged_from_id ||
                                post.reblogged_root_id ||
                                post.reblogged_from_url;
                
                // Exclude replies/comments (these are not regular posts)
                const isReply = post.type === 'answer' || 
                               (post.note_count === 0 && post.type === 'text' && !post.title && !post.body);
                
                return !isReblog && !isReply;
            });
            
            return originalPosts;
        }
        
        console.error('Tumblr API returned unexpected format:', data);
        return [];
    } catch (error) {
        console.error('Error fetching Tumblr posts:', error);
        return [];
    }
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Get post title - priority: custom metadata > Tumblr title > date
 */
function getPostTitle(post) {
    // Check custom metadata first
    const metadata = postMetadata[post.id_string];
    if (metadata && metadata.title) {
        return metadata.title;
    }
    
    // Check Tumblr post title
    if (post.title && post.title.trim() !== '') {
        return post.title;
    }
    
    // Default to formatted date
    return formatDate(post.timestamp);
}

/**
 * Get post tags - priority: custom metadata > Tumblr tags
 */
function getPostTags(post) {
    const metadata = postMetadata[post.id_string];
    if (metadata && metadata.tags && Array.isArray(metadata.tags)) {
        return metadata.tags;
    }
    
    // Return Tumblr tags, ensuring # prefix
    return (post.tags || []).map(tag => {
        const tagStr = String(tag);
        return tagStr.startsWith('#') ? tagStr : `#${tagStr}`;
    });
}

/**
 * Process Tumblr HTML content to ensure proper rendering
 * This function ensures images, links, and formatting work correctly
 */
function processTumblrHTML(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    
    // Create temporary container to parse and process HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process all images
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
        // Get image source (check src, data-src, or data-lazy-src)
        let src = img.getAttribute('src') || 
                  img.getAttribute('data-src') || 
                  img.getAttribute('data-lazy-src');
        
        if (src) {
            // Convert relative URLs to absolute
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
            
            // Remove lazy loading attributes
            ['data-src', 'data-lazy-src', 'data-original'].forEach(attr => {
                if (img.hasAttribute(attr)) {
                    img.removeAttribute(attr);
                }
            });
        }
        
        // Add styling class
        if (!img.classList.contains('post-image')) {
            img.classList.add('post-image');
        }
        
        // Ensure alt text
        if (!img.getAttribute('alt')) {
            img.setAttribute('alt', 'Post image');
        }
        
        // Ensure proper display
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
    });
    
    // Process all links
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
            // Convert relative URLs to absolute
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
    
    // Process iframes (embedded content)
    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.style.maxWidth = '100%';
        iframe.style.borderRadius = '8px';
    });
    
    // Process videos
    const videos = tempDiv.querySelectorAll('video');
    videos.forEach(video => {
        video.style.maxWidth = '100%';
        video.style.height = 'auto';
    });
    
    return tempDiv.innerHTML;
}

/**
 * Parse Tumblr post content based on post type
 * Handles: text, photo, quote, link, video, audio, chat
 */
function parseTumblrContent(post) {
    let content = '';
    
    switch (post.type) {
        case 'text':
            // Text posts: body contains HTML with all formatting
            if (post.body) {
                content = processTumblrHTML(post.body);
            }
            
            // Add photos if they exist separately (not embedded in body)
            if (post.photos && post.photos.length > 0) {
                post.photos.forEach(photo => {
                    const imgUrl = photo.original_size?.url || photo.alt_sizes?.[0]?.url;
                    if (imgUrl && !content.includes(imgUrl)) {
                        content += `<img src="${imgUrl}" alt="Post image" class="post-image" />`;
                    }
                });
            }
            break;
            
        case 'photo':
            // Photo posts: display photos first, then caption
            if (post.photos && post.photos.length > 0) {
                post.photos.forEach(photo => {
                    const imgUrl = photo.original_size?.url || photo.alt_sizes?.[0]?.url;
                    if (imgUrl) {
                        content += `<img src="${imgUrl}" alt="Post image" class="post-image" />`;
                    }
                });
            }
            
            // Caption is HTML
            if (post.caption) {
                content += processTumblrHTML(post.caption);
            }
            break;
            
        case 'quote':
            // Quote posts
            if (post.text) {
                content = `<blockquote>${processTumblrHTML(post.text)}</blockquote>`;
            }
            if (post.source) {
                content += `<p class="quote-source">— ${escapeHtml(post.source)}</p>`;
            }
            break;
            
        case 'link':
            // Link posts
            const linkUrl = post.url || '';
            const linkTitle = post.title || linkUrl;
            content = `<p><a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkTitle)}</a></p>`;
            
            // Description is HTML
            if (post.description) {
                content += processTumblrHTML(post.description);
            }
            break;
            
        case 'video':
            // Video posts
            if (post.video_url) {
                content += `<video controls class="post-video"><source src="${post.video_url}" type="video/mp4"></video>`;
            } else if (post.player && Array.isArray(post.player) && post.player.length > 0) {
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
            break;
            
        case 'audio':
            // Audio posts
            if (post.player) {
                content += post.player;
            }
            if (post.caption) {
                content += processTumblrHTML(post.caption);
            }
            break;
            
        case 'chat':
            // Chat posts
            if (post.dialogue && Array.isArray(post.dialogue)) {
                content = '<div class="chat-post">';
                post.dialogue.forEach(line => {
                    const label = escapeHtml(line.label || '');
                    const phrase = processTumblrHTML(line.phrase || '');
                    content += `<p><strong>${label}:</strong> ${phrase}</p>`;
                });
                content += '</div>';
            }
            break;
            
        default:
            // Fallback for unknown post types
            if (post.body) {
                content = processTumblrHTML(post.body);
            }
            if (post.caption) {
                content += processTumblrHTML(post.caption);
            }
    }
    
    return content;
}

/**
 * Escape HTML in text content
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Fetch comments/notes for a post
 */
async function fetchPostComments(postId) {
    try {
        const response = await fetch(
            `${TUMBLR_API_BASE}/${postId}/notes?api_key=${TUMBLR_API_KEY}`
        );
        
        if (!response.ok) {
            return [];
        }
        
        const data = await response.json();
        
        if (data.meta && data.meta.status === 200 && data.response && data.response.notes) {
            // Filter for comments/replies only
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

/**
 * Render a comment
 */
function renderComment(comment) {
    const date = new Date(comment.timestamp * 1000);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const avatarUrl = comment.blog?.avatar?.[0]?.url || '/assets/images/default-avatar.png';
    const blogName = comment.blog?.name || 'Unknown';
    const blogUrl = `https://${blogName}.tumblr.com`;
    
    return `
        <div class="comment">
            <div class="comment-avatar">
                <img src="${avatarUrl}" alt="${escapeHtml(blogName)}" />
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <a href="${blogUrl}" target="_blank" rel="noopener noreferrer" class="comment-author">${escapeHtml(blogName)}</a>
                    <time class="comment-date">${formattedDate}</time>
                </div>
                <div class="comment-text">${comment.content || ''}</div>
            </div>
        </div>
    `;
}

// Export functions for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchTumblrPosts,
        formatDate,
        getPostTitle,
        getPostTags,
        parseTumblrContent,
        fetchPostComments,
        renderComment,
        escapeHtml
    };
}
