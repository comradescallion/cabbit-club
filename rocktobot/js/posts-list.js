// Post list page functionality - sorting and filtering
// Make functions globally available

let allPosts = [];
let currentSort = 'date-desc';
let currentTagFilter = null;

// Initialize post list
async function initPostList() {
    // Load posts (either from Tumblr API or local storage)
    allPosts = await loadPosts();
    
    // Apply URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    if (tagParam) {
        currentTagFilter = tagParam;
    }
    
    const sortParam = urlParams.get('sort');
    if (sortParam) {
        currentSort = sortParam;
    }
    
    renderPostList();
    setupEventListeners();
}

// Make helper functions available globally
function getPostTitle(post) {
    const metadata = (typeof window !== 'undefined' && window.postMetadata) || postMetadata || {};
    if (metadata[post.id_string] && metadata[post.id_string].title) {
        return metadata[post.id_string].title;
    }
    // Check if Tumblr post has a title
    if (post.title) {
        return post.title;
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

// Load posts (from Tumblr or cache)
async function loadPosts() {
    // Check if we have cached posts
    const cached = localStorage.getItem('tumblr-posts-cache');
    const cacheTime = localStorage.getItem('tumblr-posts-cache-time');
    
    // Use cache if less than 1 hour old
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
        return JSON.parse(cached);
    }
    
    // Fetch from Tumblr
    if (typeof fetchTumblrPosts !== 'undefined') {
        const posts = await fetchTumblrPosts(50);
        // Cache the posts
        localStorage.setItem('tumblr-posts-cache', JSON.stringify(posts));
        localStorage.setItem('tumblr-posts-cache-time', Date.now().toString());
        return posts;
    }
    
    return [];
}

// Sort posts
function sortPosts(posts) {
    const sorted = [...posts];
    
    switch (currentSort) {
        case 'date-desc':
            sorted.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'date-asc':
            sorted.sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'title-asc':
            sorted.sort((a, b) => {
                const titleA = getPostTitle(a).toLowerCase();
                const titleB = getPostTitle(b).toLowerCase();
                return titleA.localeCompare(titleB);
            });
            break;
        case 'title-desc':
            sorted.sort((a, b) => {
                const titleA = getPostTitle(a).toLowerCase();
                const titleB = getPostTitle(b).toLowerCase();
                return titleB.localeCompare(titleA);
            });
            break;
    }
    
    return sorted;
}

// Filter posts by tag
function filterPostsByTag(posts) {
    if (!currentTagFilter) {
        return posts;
    }
    
    return posts.filter(post => {
        const tags = getPostTags(post);
        return tags.some(tag => 
            tag.toLowerCase() === currentTagFilter.toLowerCase() ||
            tag.toLowerCase().replace('#', '') === currentTagFilter.toLowerCase()
        );
    });
}

// Get all unique tags from posts
function getAllTags(posts) {
    const tagSet = new Set();
    posts.forEach(post => {
        const tags = getPostTags(post);
        tags.forEach(tag => {
            tagSet.add(tag.toLowerCase());
        });
    });
    return Array.from(tagSet).sort();
}

// Render post list
function renderPostList() {
    const container = document.getElementById('posts-list');
    if (!container) return;
    
    let filtered = filterPostsByTag(allPosts);
    filtered = sortPosts(filtered);
    
    // Render tags filter
    const tagsContainer = document.getElementById('tags-filter');
    if (tagsContainer) {
        renderTagsFilter(tagsContainer, filtered);
    }
    
    // Render sort controls
    const sortContainer = document.getElementById('sort-controls');
    if (sortContainer) {
        renderSortControls(sortContainer);
    }
    
    // Render posts
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-posts">No posts found.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(post => {
        const title = getPostTitle(post);
        const date = formatDate(post.timestamp);
        const tags = getPostTags(post);
        
        const tagsHtml = tags.map(tag => {
            const tagSlug = tag.toLowerCase().replace('#', '');
            return `<a href="?tag=${encodeURIComponent(tagSlug)}" class="tag">${tag}</a>`;
        }).join(' ');
        
        // Use dynamic post page with ID parameter
        const postUrl = `/rocktobot/posts/post.html?id=${post.id_string}`;
        
        return `
            <li class="post-card">
                <a href="${postUrl}" class="post-link">
                    <h3>${title}</h3>
                    <p class="post-date">${date}</p>
                    ${tags.length > 0 ? `<div class="post-tags">${tagsHtml}</div>` : ''}
                </a>
            </li>
        `;
    }).join('');
}

// Render tags filter
function renderTagsFilter(container, posts) {
    const allTags = getAllTags(allPosts);
    
    if (allTags.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const activeTagClass = currentTagFilter ? '' : 'active';
    const filterHtml = `
        <div class="tag-filter">
            <span class="filter-label">Filter by tag:</span>
            <a href="?" class="tag-filter-item ${activeTagClass}">All</a>
            ${allTags.map(tag => {
                const isActive = currentTagFilter === tag || currentTagFilter === tag.replace('#', '');
                return `<a href="?tag=${encodeURIComponent(tag.replace('#', ''))}" class="tag-filter-item ${isActive ? 'active' : ''}">${tag}</a>`;
            }).join('')}
        </div>
    `;
    
    container.innerHTML = filterHtml;
}

// Render sort controls
function renderSortControls(container) {
    const sortOptions = [
        { value: 'date-desc', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' },
        { value: 'title-asc', label: 'Title A-Z' },
        { value: 'title-desc', label: 'Title Z-A' }
    ];
    
    const selectHtml = `
        <label for="sort-select">Sort by:</label>
        <select id="sort-select" class="sort-select">
            ${sortOptions.map(opt => 
                `<option value="${opt.value}" ${currentSort === opt.value ? 'selected' : ''}>${opt.label}</option>`
            ).join('')}
        </select>
    `;
    
    container.innerHTML = selectHtml;
}

// Setup event listeners
function setupEventListeners() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            const url = new URL(window.location);
            url.searchParams.set('sort', currentSort);
            window.history.pushState({}, '', url);
            renderPostList();
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostList);
} else {
    initPostList();
}

