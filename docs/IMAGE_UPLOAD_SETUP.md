# Image Upload Setup Guide

## Overview
The trek creation system now supports uploading images from your device instead of using image URLs. The images are stored in Supabase Storage and displayed automatically when users view treks.

## Setup Instructions

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `trek-images`
5. **Make sure to make it PUBLIC** (toggle the public option)
6. Click **Create bucket**

### 2. Set Up Storage Policies

1. Click on the `trek-images` bucket you just created
2. Go to the **Policies** tab
3. Add the following policies:

#### Policy 1: Allow Public Read Access
- Click **New Policy**
- Choose **For queries with filters** or create from template
- Select **SELECT** operation
- Target roles: **Public**
- With custom expression: Leave empty (allows public read)
- Create policy

#### Policy 2: Allow Authenticated Users to Upload
- Click **New Policy**
- Select **INSERT** operation
- Target roles: **Authenticated**
- Create policy

#### Policy 3: Allow Users to Delete Their Own Images
- Click **New Policy**
- Select **DELETE** operation
- Target roles: **Authenticated**
- Create policy

### 3. Verify Configuration

Test the setup:
1. Go to Admin Portal → Create New Trek
2. You should see the new image upload interface instead of the URL input
3. Select an image from your device
4. Create the trek
5. View the trek list - the image should display

## How It Works

### For Admins (Creating Treks):
1. Fill in the trek form
2. Click the image upload area
3. Select an image from your device (max 5MB, PNG/JPG/GIF)
4. Preview the image before creating
5. Click "Create Trek" to upload and save

### For Users (Viewing Treks):
1. Images appear automatically on trek cards in the list
2. Trek detail pages show full-size images as the hero banner
3. Falls back to emoji if no image is present

## File Structure

The images are organized in Supabase Storage as:
```
trek-images/
  ├── himalayan-trek-1702345678-abc123.jpg
  ├── sunrise-trek-1702345679-def456.png
  └── ...
```

## Image Specifications

- **Formats**: PNG, JPG, GIF
- **Max Size**: 5MB
- **Recommended Size**: 1200x800px or larger for best quality
- **Aspect Ratio**: 3:2 recommended (looks best on trek cards)

## Troubleshooting

### Images not uploading?
- Ensure the `trek-images` bucket exists and is PUBLIC
- Check that storage policies are correctly configured
- Verify file size is under 5MB
- Check browser console for error messages

### Images not displaying?
- Verify the bucket is PUBLIC
- Check that the image URL in the database is correct
- Clear browser cache and reload

### Need to delete an image?
- Images are automatically deleted from storage if the trek is deleted (you may need to add this functionality)
- Or manually delete from Supabase Storage dashboard

## Database Changes

The `treks` table continues to use the `image_url` field (no schema changes needed). The URL now points to Supabase Storage instead of external URLs.
