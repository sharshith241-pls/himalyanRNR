# Guide Portal Setup Guide

## Overview
The Guide Portal allows trek guides to manage their assigned treks, view registrations, add itinerary details, and upload trek images.

## Features

### 1. Guide Login
- Guides login using their email and password credentials
- Email is stored in `guide_email` field in the `treks` table
- Guides can only access treks assigned to them

### 2. Dashboard
- View all assigned treks
- See total registrations per trek
- Quick view of participant details
- One-click access to trek management

### 3. Trek Management
Each guide can:
- **Manage Itinerary**: Add, edit, and delete day-by-day itinerary details
- **Upload Images**: Upload trek images that will be displayed on the trek details page
- **View Participants**: See all registered users for each trek

## Setup Instructions

### Step 1: Create Guide Accounts in Supabase

Run the following SQL in your Supabase SQL editor to set up the guides table:

```sql
-- Copy the contents of GUIDES_AND_ITINERARY_TABLES.sql from the docs folder
```

### Step 2: Create Guide Users in Supabase Auth

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users
3. Create new users with:
   - Email: guide email address
   - Password: temporary password (share with guide)
   - Click "Send invite email" (optional)

### Step 3: Add Guides to Treks

Update the `treks` table with guide information:

```sql
UPDATE public.treks
SET guide_email = 'guide@example.com'
WHERE id = 'trek-id-here';
```

### Step 4: Add Guide Profile (Optional)

Insert guide information in the `guides` table:

```sql
INSERT INTO public.guides (id, email, full_name, phone, bio, experience_years)
VALUES ('user-id-from-auth', 'guide@example.com', 'Guide Name', '+91-XXXXXXXXXX', 'Bio', 5);
```

## Database Tables

### guides Table
- `id` (UUID): User ID from auth.users
- `email` (TEXT): Guide email
- `full_name` (TEXT): Guide name
- `phone` (TEXT): Contact number
- `bio` (TEXT): Professional bio
- `experience_years` (INTEGER): Years of trekking experience
- `created_at` (TIMESTAMP): Account creation date
- `updated_at` (TIMESTAMP): Last update date

### trek_itinerary Table
- `id` (UUID): Unique identifier
- `trek_id` (UUID): Reference to trek
- `day` (INTEGER): Day number (1, 2, 3, etc.)
- `title` (TEXT): Activity title for the day
- `description` (TEXT): Detailed description
- `image_url` (TEXT): Optional image URL
- `created_at` (TIMESTAMP): Creation date
- `updated_at` (TIMESTAMP): Last update date

## How Guides Use the Portal

### Accessing the Portal
1. Navigate to `/guide/login`
2. Enter your email and password
3. Click "Guide Sign In"

### View Dashboard
- After login, you'll see your assigned treks
- Click on any trek to view participant details
- See registration statistics

### Manage Trek Details
1. Click "Manage Trek" button
2. Upload a cover image for the trek
3. Add day-by-day itinerary:
   - Click "+ Add Day"
   - Enter day number
   - Add activity title and description
   - Click "Add Itinerary"
4. Delete items by clicking "🗑️ Delete"

### View Participants
- See all registered users for each trek
- View registration dates
- Check participant email addresses
- Participants are automatically listed as "Confirmed"

## Storage Setup for Images

Images are stored in Supabase Storage. Create a bucket:

```sql
-- Storage bucket for trek images (through Supabase Dashboard)
-- Go to Storage > Create new bucket
-- Bucket name: trek-images
-- Make it public
```

## Security Features

- Guides can only view/edit their own assigned treks
- Participant data is protected by RLS policies
- Guides cannot access other guides' treks
- All actions are logged with timestamps

## Troubleshooting

### Guide Cannot Login
- Verify guide email exists in Supabase Auth
- Check password is correct
- Ensure user is not disabled in Auth

### Cannot See Assigned Treks
- Verify `guide_email` field in treks table matches guide's email
- Check for typos in email address
- Confirm guide account is active

### Image Upload Failing
- Check storage bucket exists and is public
- Verify image file size is reasonable
- Check file format (JPG, PNG, WebP supported)

### Itinerary Not Saving
- Verify trek_id matches in database
- Check guide has access to this trek
- Ensure all required fields are filled

## Best Practices

1. **Itinerary Planning**: Plan itinerary before trek starts for better participant experience
2. **Image Quality**: Use high-quality images (at least 1200x800 pixels)
3. **Descriptions**: Write detailed day descriptions to help participants prepare
4. **Updates**: Keep participant list and details current
5. **Regular Backups**: Ensure guides know how to download participant lists if needed

## Admin Tasks

### To Add/Update Guides:
1. Create user in Supabase Auth
2. Insert into guides table
3. Update treks table with guide_email

### To Remove Guides:
1. Update treks table to remove guide_email
2. Disable user in Supabase Auth

### To View Guide Activity:
- Check trek_itinerary table for recent edits
- Monitor participant registrations through bookings table
