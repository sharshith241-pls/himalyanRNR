# Quick Start: Image Upload Feature

## For Admins

### To Create a Trek with Image:

1. Go to Admin Portal → **Create New Trek**
2. Fill in the form:
   - Trek Title (required)
   - Location (required)
   - Price (required)
   - Duration
   - Difficulty
   - Category
   - Description

3. **Upload Image:**
   - Click the dashed image box OR drag & drop an image
   - Select from your device (PNG, JPG, GIF - max 5MB)
   - Preview will show your selected image
   - Can remove and select different image if needed

4. Click **Create Trek**
   - Image uploads automatically
   - Trek is created with the image

## For Users

### To View Trek Images:

**On Trek List Page:**
- Browse treks - each card shows the uploaded image
- Hover over image for zoom effect
- Click to view trek details

**On Trek Detail Page:**
- Full-size image displays as hero banner at top
- Scroll down to see all trek information

## Setup (One-Time)

**Before using this feature, you MUST:**

1. Go to Supabase Dashboard
2. Create storage bucket:
   - Name: `trek-images`
   - Make it **PUBLIC**
3. Add storage policies for public access

See `IMAGE_UPLOAD_SETUP.md` for detailed instructions.

## Troubleshooting

### "Upload failed" error?
- ✓ Check file size is under 5MB
- ✓ Check file is an image (PNG, JPG, GIF)
- ✓ Check internet connection
- ✓ Try refreshing and uploading again

### Image not showing on trek?
- ✓ Check the trek-images bucket exists and is PUBLIC
- ✓ Check storage policies are set correctly
- ✓ Clear browser cache
- ✓ Hard refresh (Ctrl+Shift+R)

### Can't find the image upload box?
- ✓ Make sure you're in Admin Portal
- ✓ Make sure you're on Create New Trek page
- ✓ Check that `trek-images` bucket is created

## Image Specifications

| Property | Value |
|----------|-------|
| Formats | PNG, JPG, GIF |
| Max Size | 5MB |
| Recommended Size | 1200x800px |
| Aspect Ratio | 3:2 (looks best) |

## What Happens Behind the Scenes

```
Your Action          What Happens
─────────────────────────────────────
Select Image    →    File validated
                     Uploaded to Supabase Storage
                     Public URL generated
                
Click "Create"  →    Trek data + image URL saved to database
                     Redirected to trek list
                
View Trek List  →    Images loaded from Storage
                     Displayed on trek cards
                
View Trek Details→   Full image shown as hero banner
```

## Need Help?

Check these files for more info:
- `IMAGE_UPLOAD_SETUP.md` - Detailed setup guide
- `IMAGE_UPLOAD_IMPLEMENTATION.md` - Technical details
