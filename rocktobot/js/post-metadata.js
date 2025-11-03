// Post metadata configuration
// Add custom titles and tags for posts here
// Format: 'tumblr-post-id': { title: 'Custom Title', tags: ['#tag1', '#tag2'] }

// Default metadata config (can be edited directly)
const postMetadataConfig = {
    // Example:
    // '1234567890': {
    //     title: 'My Custom Post Title',
    //     tags: ['#ai', '#theology', '#life']
    // }
};

// Initialize postMetadata as global variable
if (typeof window !== 'undefined') {
    // Make postMetadata available globally
    window.postMetadata = postMetadataConfig;
    
    // Load metadata from external JSON file if it exists
    (async function loadPostMetadata() {
        try {
            const response = await fetch('/rocktobot/data/post-metadata.json');
            if (response.ok) {
                const metadata = await response.json();
                // Remove example entry if it exists
                delete metadata._comment;
                delete metadata['example-post-id'];
                // Merge with default config
                window.postMetadata = { ...postMetadataConfig, ...metadata };
            }
        } catch (error) {
            console.log('Using default metadata config');
            window.postMetadata = postMetadataConfig;
        }
    })();
}

