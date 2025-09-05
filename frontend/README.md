# TrustDiner Frontend

React-based frontend application for the TrustDiner platform, built with Next.js 15 and TypeScript.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API (@react-google-maps/api)
- **Type Safety**: TypeScript
- **State Management**: React Context API

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 📁 Project Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── search/            # Search functionality
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── icons/            # Icon components
│   ├── Header.tsx        # Navigation header
│   ├── ListView.tsx      # Restaurant list view
│   └── LocalSearch.tsx   # Search functionality
├── context/              # React Context providers
│   └── AuthContext.tsx   # Authentication state
└── lib/                  # Utility functions and hooks
```

## 🎨 Components

### Core Components
- **Header**: Navigation and user authentication
- **ListView**: Restaurant listings with filtering
- **LocalSearch**: Location-based search
- **GoogleAPIUsageDashboard**: API usage monitoring
- **AllergenIconDemo**: Allergen safety indicators

### Map Integration
- Google Maps with custom markers
- Place details and photos
- Real-time search and filtering

## 🔌 API Integration

All API calls are proxied through Next.js to the backend server:

```typescript
// Automatic proxy to backend via next.config.js
fetch('/api/establishments')  // → http://localhost:3001/api/establishments
fetch('/api/search?q=pizza') // → http://localhost:3001/api/search?q=pizza
```

## 🎯 Key Features

- **Restaurant Discovery**: Browse and search restaurants
- **Allergen Safety**: View allergen ratings and reviews
- **Interactive Maps**: Google Maps integration with custom markers
- **User Authentication**: Firebase Auth integration
- **Responsive Design**: Mobile-first responsive layout
- **Performance**: Optimized with Next.js features

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_api_key
```

### Build Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

## 🧪 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
```

## 📱 Responsive Design

The application is designed mobile-first with breakpoints:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🔐 Security

- Content Security Policy headers
- XSS protection
- HTTPS enforcement in production
- Secure API communication

## 📈 Performance

- Automatic code splitting
- Image optimization
- Static generation where possible
- API response caching

---

Built with Next.js and ❤️ for the allergy community. 