# ZINEs - ZINE Sharing SNS

A social networking platform for sharing creative ZINEs (self-published magazines/artworks).

## Features

- 📸 Share ZINEs with up to 3 images per post
- ❤️ Like and follow functionality
- 🎨 Responsive design with light/dark mode support
- 🔐 Authentication with email/password or social providers (Google, GitHub)
- 📱 Mobile-first design with Material Symbols icons
- ♾️ Infinite scroll for seamless browsing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: HeroUI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Image Processing**: Sharp (WebP conversion)
- **Icons**: Material Symbols Rounded

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zines
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in the SQL editor
   - Get your project URL and anon key from project settings

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── navigation/   # Navigation components (FAB)
│   ├── posts/        # Post-related components
│   └── providers/    # Context providers
├── lib/              # Library configurations
│   └── supabase/     # Supabase client setup
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── hooks/            # Custom React hooks
```

## Database Schema

The app uses the following main tables:
- `profiles` - User profiles
- `posts` - ZINE posts with image_urls, title, body, and tags
- `follows` - Follow relationships
- `likes` - Post likes

## Development

### Code Style
- ESLint and Prettier are configured for consistent code formatting
- TypeScript strict mode is enabled

### Component Guidelines
- Use HeroUI components for UI consistency
- Follow mobile-first responsive design
- Implement proper loading and error states

## Deployment

The app can be deployed on Vercel:

1. Push your code to GitHub
2. Import the repository on Vercel
3. Add environment variables
4. Deploy

## Future Enhancements

- [ ] Search functionality
- [ ] Tag-based filtering
- [ ] User notifications
- [ ] Comment system
- [ ] Premium features (more images per post)
- [ ] AI-powered features using Claude API

## License

MIT