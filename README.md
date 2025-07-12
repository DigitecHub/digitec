# Digitec Learning Platform

A modern online learning platform for Digitec IT Training, built with Next.js and Supabase.

## Features

- **User Authentication**: Email/password and Google sign-in via Supabase Auth
- **Course Catalog**: Browse available courses with filtering and search
- **Course Enrollment**: Enroll in courses and track progress
- **Learning Dashboard**: View enrolled courses and continue learning
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Authentication System

The platform uses Supabase Authentication for user management:

- Email/password registration and login
- Google OAuth integration
- Protected routes with middleware
- User profile management

## Course System

Courses are organized in a hierarchical structure:

- **Courses**: Main course categories (e.g., Frontend Development)
- **Sub-courses**: Modules within a course (e.g., HTML, CSS, JavaScript)
- **Lessons**: Individual lessons within a sub-course

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `user_profiles`: Extended user information
- `courses`: Main course information
- `sub_courses`: Course modules
- `lessons`: Individual lessons
- `enrollments`: User course enrollments
- `sub_course_enrollments`: User module enrollments
- `lesson_progress`: User progress tracking

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/digitec-learning-platform.git
   cd digitec-learning-platform
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL scripts in `src/database/schema.sql` in the Supabase SQL editor

5. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be deployed on Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set the environment variables
4. Deploy

## Tech Stack

- **Frontend**: Next.js, React, CSS Modules
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Styling**: CSS Modules with Bootstrap
- **Hosting**: Vercel

## Project Structure

```
digitec/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js app router
│   │   ├── auth/      # Authentication routes
│   │   ├── courses/   # Course routes
│   │   ├── dashboard/ # User dashboard
│   │   └── ...
│   ├── components/    # React components
│   ├── database/      # Database schema and utilities
│   ├── middleware.js  # Auth middleware
│   └── styles/        # CSS styles
├── .env.local         # Environment variables (not in repo)
└── package.json       # Project dependencies
```

## License

This project is proprietary and confidential.

## Contact

For any inquiries, please contact [your@email.com](mailto:your@email.com).
# digitec
