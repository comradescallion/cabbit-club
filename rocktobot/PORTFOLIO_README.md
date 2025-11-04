# Portfolio System

Easy-to-use portfolio system for rocktobot projects.

## Adding a New Project

To add a new project, simply edit `rocktobot/data/projects.json` and add a new entry to the `projects` array:

```json
{
  "id": "my-project-slug",
  "title": "My Project Title",
  "bannerImage": "/rocktobot/assets/projects/my-project/banner.jpg",
  "timeFrame": "2024 - Present",
  "description": "A detailed description of the project. You can use multiple paragraphs.\n\nJust add a blank line between paragraphs.",
  "involvement": "My role included [specific contributions]. I worked on [technologies/areas].",
  "links": [
    {
      "label": "Live Demo",
      "url": "https://example.com",
      "type": "external"
    },
    {
      "label": "GitHub",
      "url": "https://github.com/example",
      "type": "external"
    }
  ],
  "gallery": [
    {
      "image": "/rocktobot/assets/projects/my-project/image1.jpg",
      "caption": "Screenshot showing the main interface"
    },
    {
      "image": "/rocktobot/assets/projects/my-project/image2.jpg",
      "caption": "Detail view of the feature"
    }
  ],
  "has3D": false,
  "viewer3D": null
}
```

### Required Fields

- **id**: Unique identifier (used in URL, e.g., `my-project-slug`)
- **title**: Project title displayed on banner and page
- **bannerImage**: Path to banner image (4:1 aspect ratio recommended)
- **timeFrame**: Time period (e.g., "2024 - Present", "2023 - 2024")
- **description**: Main project description (supports line breaks with `\n\n`)
- **involvement**: Your personal involvement description
- **links**: Array of links (can be empty array `[]`)
- **gallery**: Array of gallery images with captions (can be empty array `[]`)
- **has3D**: Boolean indicating if project has 3D viewer
- **viewer3D**: 3D viewer configuration object (or `null`)

### Optional Fields

- **links**: Can be empty array if no links
- **gallery**: Can be empty array if no gallery images
- **has3D**: Set to `false` if no 3D viewer
- **viewer3D**: Set to `null` if no 3D viewer

## 3D Viewer Support

For projects with 3D models, set `has3D: true` and configure the viewer:

```json
{
  "has3D": true,
  "viewer3D": {
    "type": "model-viewer",
    "model": "/rocktobot/assets/projects/my-project/model.glb",
    "format": "glb",
    "alt": "3D Model Description"
  }
}
```

Currently supports `model-viewer` type (Google's model-viewer web component) for GLB/GLTF files.

## Gallery Images

Add images to the gallery array. Each image should have:
- **image**: Path to the image file
- **caption**: Optional caption text (can be empty string)

Images are clickable and open in a lightbox with navigation.

## File Structure

```
rocktobot/
├── data/
│   └── projects.json          # Project data (edit this to add projects)
├── assets/
│   └── projects/
│       └── [project-id]/
│           ├── banner.jpg     # Banner image (4:1 aspect ratio)
│           ├── image1.jpg     # Gallery images
│           ├── image2.jpg
│           └── model.glb      # 3D model (if applicable)
├── projects/
│   └── project.html           # Dynamic project page template
└── js/
    └── portfolio.js           # Portfolio functionality
```

## Features

- **4:1 Aspect Ratio Banners**: Each project displays as a banner with overlaid title
- **Individual Project Pages**: Click any banner to view full project details
- **Time Frame Display**: Shows when the project was worked on
- **Description & Involvement**: Detailed text about the project and your role
- **Links Section**: External links to demos, GitHub, documentation, etc.
- **Image Gallery**: Scrollable grid of images with captions
- **Lightbox Viewer**: Click any gallery image to view in fullscreen with navigation
- **3D Viewer Support**: Interactive 3D model viewers for applicable projects
- **Easy to Add**: Just edit the JSON file to add new projects

## URL Structure

- Portfolio grid: `/rocktobot/#portfolio`
- Individual project: `/rocktobot/projects/project.html?id=project-id`

