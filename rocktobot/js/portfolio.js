// Portfolio functionality for rocktobot
// Manages project display and navigation

let projectsData = [];

/**
 * Load projects from JSON file
 */
async function loadProjects() {
    try {
        const response = await fetch('/rocktobot/data/projects.json');
        if (!response.ok) {
            console.error('Failed to load projects:', response.status);
            return [];
        }
        
        const data = await response.json();
        return data.projects || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

/**
 * Initialize portfolio grid on homepage
 */
async function initPortfolio() {
    const container = document.getElementById('portfolio-grid');
    if (!container) return;
    
    projectsData = await loadProjects();
    
    if (projectsData.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects available yet.</p>';
        return;
    }
    
    renderPortfolioGrid(container);
}

/**
 * Render portfolio grid with 4:1 aspect ratio banners
 */
function renderPortfolioGrid(container) {
    container.innerHTML = projectsData.map(project => {
        // Use dynamic project page with ID parameter
        const projectUrl = `/rocktobot/projects/project.html?id=${project.id}`;
        
        return `
            <li class="project-banner">
                <a href="${projectUrl}" class="project-banner-link">
                    <div class="project-banner-image" style="background-image: url('${project.bannerImage}');">
                        <div class="project-banner-overlay">
                            <h3 class="project-banner-title">${escapeHtml(project.title)}</h3>
                        </div>
                    </div>
                </a>
            </li>
        `;
    }).join('');
}

/**
 * Initialize individual project page
 */
async function initProjectPage() {
    // Get project ID from URL parameter or filename
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('id');
    
    // Fallback: try to get from filename
    if (!projectId) {
        const pathParts = window.location.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        projectId = filename.replace('.html', '');
    }
    
    if (!projectId) {
        const container = document.getElementById('project-content');
        if (container) {
            container.innerHTML = '<p>Project ID not found. Please provide a project ID in the URL.</p>';
        }
        return;
    }
    
    // Load projects
    projectsData = await loadProjects();
    const project = projectsData.find(p => p.id === projectId);
    
    if (!project) {
        const container = document.getElementById('project-content');
        if (container) {
            container.innerHTML = '<p>Project not found.</p>';
        }
        return;
    }
    
    // Render project page
    renderProjectPage(project);
}

/**
 * Render individual project page
 */
function renderProjectPage(project) {
    const container = document.getElementById('project-content');
    if (!container) return;
    
    // Update page title
    document.title = `${project.title} — Portfolio — rocktobot`;
    
    // Build links HTML
    const linksHtml = project.links && project.links.length > 0 ? `
        <div class="project-links">
            <h3>Links</h3>
            <ul class="project-links-list">
                ${project.links.map(link => `
                    <li>
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link">
                            ${escapeHtml(link.label)}
                            <span class="external-icon">↗</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : '';
    
    // Build gallery HTML
    const galleryHtml = project.gallery && project.gallery.length > 0 ? `
        <div class="project-gallery">
            <h3>Gallery</h3>
            <div class="gallery-grid">
                ${project.gallery.map((item, index) => `
                    <div class="gallery-item" data-index="${index}">
                        <img src="${item.image}" alt="${escapeHtml(item.caption || '')}" class="gallery-thumbnail" />
                        ${item.caption ? `<p class="gallery-caption">${escapeHtml(item.caption)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Build 3D viewer HTML if applicable
    const viewer3DHtml = project.has3D && project.viewer3D ? `
        <div class="project-3d-viewer">
            <h3>3D Viewer</h3>
            <div class="viewer-container">
                ${get3DViewerHTML(project.viewer3D)}
            </div>
        </div>
    ` : '';
    
    container.innerHTML = `
        <div class="project-back">
            <a href="/rocktobot/#portfolio" class="back-button">← Back to Portfolio</a>
        </div>
        
        <article class="project-article">
            <header class="project-header">
                <h1>${escapeHtml(project.title)}</h1>
                ${project.timeFrame ? `<p class="project-timeframe">${escapeHtml(project.timeFrame)}</p>` : ''}
            </header>
            
            <div class="project-body">
                ${project.description ? `<div class="project-description">${formatDescription(project.description)}</div>` : ''}
                ${project.involvement ? `<div class="project-involvement"><h3>My Involvement</h3><p>${formatDescription(project.involvement)}</p></div>` : ''}
                
                ${linksHtml}
                ${viewer3DHtml}
                ${galleryHtml}
            </div>
        </article>
    `;
    
    // Initialize gallery lightbox
    if (project.gallery && project.gallery.length > 0) {
        initGalleryLightbox(project.gallery);
    }
    
    // Initialize 3D viewer if applicable
    if (project.has3D && project.viewer3D) {
        init3DViewer(project.viewer3D);
    }
}

/**
 * Format description text (preserve line breaks)
 */
function formatDescription(text) {
    if (!text) return '';
    // Convert line breaks to paragraphs
    return text.split('\n\n').map(para => {
        if (para.trim()) {
            return `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`;
        }
        return '';
    }).join('');
}

/**
 * Get 3D viewer HTML based on viewer type
 */
function get3DViewerHTML(viewer) {
    if (viewer.type === 'model-viewer') {
        // Using model-viewer web component (requires loading the library)
        return `
            <model-viewer
                src="${viewer.model}"
                alt="${viewer.alt || '3D Model'}"
                auto-rotate
                camera-controls
                style="width: 100%; height: 500px; background: var(--card);"
            ></model-viewer>
        `;
    }
    // Add other 3D viewer types as needed
    return '';
}

/**
 * Initialize 3D viewer
 */
function init3DViewer(viewer) {
    if (viewer.type === 'model-viewer') {
        // Load model-viewer library if not already loaded
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
            document.head.appendChild(script);
        }
    }
}

/**
 * Initialize gallery lightbox
 */
function initGalleryLightbox(gallery) {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(gallery, index);
        });
    });
}

/**
 * Open lightbox for gallery image
 */
function openLightbox(gallery, startIndex) {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" aria-label="Close">&times;</button>
            <button class="lightbox-prev" aria-label="Previous">‹</button>
            <button class="lightbox-next" aria-label="Next">›</button>
            <div class="lightbox-image-container">
                <img src="${gallery[startIndex].image}" alt="${escapeHtml(gallery[startIndex].caption || '')}" class="lightbox-image" />
                ${gallery[startIndex].caption ? `<p class="lightbox-caption">${escapeHtml(gallery[startIndex].caption)}</p>` : ''}
            </div>
            <div class="lightbox-counter">${startIndex + 1} / ${gallery.length}</div>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    let currentIndex = startIndex;
    
    // Update image
    const updateImage = (index) => {
        const img = lightbox.querySelector('.lightbox-image');
        const caption = lightbox.querySelector('.lightbox-caption');
        const counter = lightbox.querySelector('.lightbox-counter');
        
        img.src = gallery[index].image;
        img.alt = gallery[index].caption || '';
        
        if (caption) {
            caption.textContent = gallery[index].caption || '';
            caption.style.display = gallery[index].caption ? 'block' : 'none';
        }
        
        if (counter) {
            counter.textContent = `${index + 1} / ${gallery.length}`;
        }
    };
    
    // Navigation
    lightbox.querySelector('.lightbox-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + gallery.length) % gallery.length;
        updateImage(currentIndex);
    });
    
    lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % gallery.length;
        updateImage(currentIndex);
    });
    
    // Keyboard navigation
    const handleKey = (e) => {
        if (e.key === 'ArrowLeft') {
            currentIndex = (currentIndex - 1 + gallery.length) % gallery.length;
            updateImage(currentIndex);
        } else if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % gallery.length;
            updateImage(currentIndex);
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    };
    
    document.addEventListener('keydown', handleKey);
    
    // Close handlers
    const closeLightbox = () => {
        document.removeEventListener('keydown', handleKey);
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
    };
    
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
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

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProjects,
        initPortfolio,
        initProjectPage,
        renderPortfolioGrid,
        renderProjectPage
    };
}

