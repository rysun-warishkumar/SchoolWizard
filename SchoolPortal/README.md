# School Portal

A modern, professional school website with dark/light mode support and full responsiveness. This portal is dynamically configured from the Admin CMS panel.

## Features

- 🎨 Modern, professional design
- 🌓 Dark/Light mode toggle
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Fast and optimized
- 🎯 Clean code structure
- 🔧 Easy to customize
- 🔄 Dynamic content from Admin CMS

## Getting Started

### Installation

```bash
cd SchoolPortal
npm install
```

### Environment Configuration

Create a `.env` file in the SchoolPortal directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

**Note:** Make sure the backend server is running on the specified port.

### Development

```bash
npm run dev
```

The website will be available at `http://localhost:5174`

### Build

```bash
npm run build
```

## Configuration

The website content is managed from the Admin Panel:

1. **Header Configuration** (Admin → Front CMS Website → Header Configuration):
   - Website Logo
   - School Name
   - Tag Line (with show/hide option)
   - Contact Information (Email & Phone)
   - Social Media Links (with enable/disable per platform)

2. **Home Page Banners** (Admin → Front CMS Website → Home Page Banners):
   - Add/Edit/Remove banner carousel
   - Configure banner title, description, image
   - Set button text and URL
   - Control sort order and active status

## Project Structure

```
SchoolPortal/
├── src/
│   ├── components/     # Reusable components (Header, Footer, Layout)
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
└── package.json
```

## API Integration

The portal fetches dynamic content from:
- `/api/public/website/website-settings` - Header and website settings
- `/api/public/website/banners` - Active homepage banners

## Customization

- Update colors in `src/index.css` CSS variables
- Modify page layouts in `src/pages/`
- Customize components in `src/components/`

## License

ISC
