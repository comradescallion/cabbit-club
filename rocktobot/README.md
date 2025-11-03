# Rocktobot Blog

Personal portfolio and blog section for rocktobot.

## Features

- **Tumblr Integration**: Fetches posts from rocktobot.tumblr.com
- **Post Filtering**: Filter posts by tags
- **Post Sorting**: Sort by date (newest/oldest) or title (A-Z/Z-A)
- **Custom Titles**: Override default post titles with custom metadata
- **Comments**: Display Tumblr comments with avatars and timestamps
- **Contact Form**: Email contact form at the bottom of each post

## Setup

### 1. Get Tumblr API Key

1. Go to https://www.tumblr.com/oauth/apps
2. Register a new application or use an existing one
3. Get your API key (OAuth Consumer Key)

### 2. Configure API Key

Edit `rocktobot/js/blog.js` and replace `YOUR_TUMBLR_API_KEY` with your actual API key:

```javascript
const TUMBLR_API_KEY = 'your-actual-api-key-here';
```

**Note:** Tumblr API supports CORS for public blog posts, so you can call the API directly from the browser. However, if you encounter CORS issues, you may need to use a proxy server or fetch posts server-side.

### 3. Configure Email

Edit `rocktobot/js/post-page.js` and replace `YOUR_EMAIL@example.com` with your email:

```javascript
const email = 'your-email@example.com';
```

### 4. Custom Post Metadata (Optional)

To add custom titles and tags to posts, edit `rocktobot/data/post-metadata.json`:

```json
{
  "tumblr-post-id": {
    "title": "My Custom Title",
    "tags": ["#ai", "#theology", "#life"]
  }
}
```

The post ID can be found in the Tumblr post URL or in the API response.

## How It Works

- **Post List**: Automatically loads posts from Tumblr API (excluding reblogs)
- **Post Pages**: Dynamic post pages are generated from Tumblr data using URL parameters (`?id=post-id`)
- **Caching**: Posts are cached in localStorage for 1 hour to reduce API calls
- **Comments**: Fetched from Tumblr API for each post
- **Custom Metadata**: Override post titles and tags via `post-metadata.json`

## Features

### Post List (`/rocktobot/posts/`)
- Displays all posts from Tumblr (excluding reblogs)
- Sort by: Date (newest/oldest) or Title (A-Z/Z-A)
- Filter by tags
- Clickable tags that filter the list

### Post Pages (`/rocktobot/posts/post.html?id=post-id`)
- Full post content with formatting
- Images embedded from Tumblr
- Tags displayed as links
- Tumblr comments section (if available)
- Email contact form at bottom

### Custom Titles and Tags
- Edit `rocktobot/data/post-metadata.json` to add custom titles
- Override default tags with custom tags
- If no custom title is provided, defaults to posting date

## File Structure

```
rocktobot/
├── index.html              # Main page
├── posts/
│   ├── index.html         # Post list page
│   └── hello-world.html   # Example post template
├── js/
│   ├── blog.js            # Core Tumblr API functions
│   ├── posts-list.js      # Post list page functionality
│   ├── post-page.js       # Individual post page functionality
│   └── post-metadata.js   # Custom metadata loader
├── css/
│   └── style.css          # Styles
└── data/
    └── post-metadata.json # Custom post titles and tags
```

