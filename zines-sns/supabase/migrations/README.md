# Supabase Migrations

This directory contains SQL migration files for the ZINEs SNS application.

## Migrations

### 20240108_create_profiles_table.sql
- Creates the `profiles` table with the following columns:
  - `id` (UUID) - Primary key referencing auth.users(id)
  - `username` (TEXT) - Unique username derived from email prefix
  - `avatar_url` (TEXT) - URL to user's avatar image
  - `created_at` (TIMESTAMP) - Profile creation timestamp
  - `updated_at` (TIMESTAMP) - Last update timestamp
- Sets up Row Level Security policies
- Creates indexes for performance
- Adds update trigger for `updated_at` column

### 20240108_update_user_profile_creation.sql
- Updates the `handle_new_user()` function to:
  - Extract username from email (part before @)
  - Set a default avatar URL using DiceBear API with user ID as seed
  - Handle username conflicts by appending a random suffix
- Ensures new user profiles are created automatically on sign-up

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20240108_create_profiles_table.sql
supabase db push --file supabase/migrations/20240108_update_user_profile_creation.sql
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration content
4. Execute the SQL

### Option 3: Direct Database Connection
```bash
# Connect to your database and run
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20240108_create_profiles_table.sql
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20240108_update_user_profile_creation.sql
```

## Important Notes

1. **Order Matters**: Apply `20240108_create_profiles_table.sql` before `20240108_update_user_profile_creation.sql`
2. **Default Avatar**: The migration uses DiceBear API for generating default avatars. You can change this by modifying the `default_avatar_url` in the migration.
3. **Username Conflicts**: If a username already exists (e.g., multiple users with email john@example.com), the system appends a random 6-character suffix.

## Testing

After applying migrations, test the sign-up flow:
1. Sign up with a new email
2. Check that a profile is created with:
   - Username = email prefix (e.g., "john" from "john@example.com")
   - Avatar URL = DiceBear generated avatar
   - Proper timestamps