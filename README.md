# Momento - Collaborative Experience-Sharing Platform

A Next.js application that intelligently aggregates individual user perspectives into cohesive, shared moments, creating multi-dimensional views of events like conferences, concerts, and weddings.

## Features

- Event creation and management
- Location-based post clustering
- Interactive heatmap visualization
- Timeline view of events
- User authentication
- Real-time post creation and sharing

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Firebase Auth (mock in development)
- **Database**: Firebase Firestore (mock in development)
- **Storage**: Firebase Storage (mock in development)
- **Maps**: Mapbox GL
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Mapbox API key (for maps functionality)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/soboy2/momento.git
   cd momento
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel

1. Push your code to GitHub

2. Visit [Vercel](https://vercel.com) and sign up or log in

3. Click "Add New..." and select "Project"

4. Connect your GitHub account and select the repository

5. Configure the project:
   - Framework Preset: Next.js (should be auto-detected)
   - Root Directory: ./
   - Build Command: Leave as default (next build)
   - Output Directory: Leave as default (.next)
   - Install Command: Leave as default (npm install)

6. Add environment variables:
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token

7. Click "Deploy"

## Environment Variables

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Required for maps functionality

## Production Considerations

- The application currently uses localStorage for storing mock data in development
- For production, implement a real database connection (Firebase is already set up in the code)
- Uncomment Firebase imports in `firebaseUtils.ts` and add your Firebase configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.