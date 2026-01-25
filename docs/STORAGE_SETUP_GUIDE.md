# Supabase Storage Setup Guide

## Create trek-images Bucket

### Via Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - You should see list of existing buckets

3. **Create New Bucket**
   - Click "Create new bucket" button
   - Bucket name: `trek-images`
   - **Uncheck** "Private bucket" to make it public
   - Click "Create bucket"

4. **Set Public Policy**
   - The bucket is now created
   - You can now upload and access files publicly

### Via SQL (Alternative)

If you prefer to use SQL:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trek-images', 'trek-images', true);

-- Create policy for public read access
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'trek-images');

-- Create policy for authenticated uploads
CREATE POLICY "Authenticated users can upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trek-images' 
    AND auth.role() = 'authenticated'
  );

-- Create policy for authenticated updates
CREATE POLICY "Authenticated users can update"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated');

-- Create policy for authenticated deletes
CREATE POLICY "Authenticated users can delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated');
```

## Image Upload Flow

When a guide uploads an image:

1. **File Selected**: Guide chooses image file
2. **Upload**: File sent to `trek-images` bucket with path: `trek-images/{trek-id}-{timestamp}.{ext}`
3. **Storage**: File stored securely in Supabase Storage
4. **URL Generated**: Public URL created automatically
5. **Database Updated**: Trek image_url field updated with public URL
6. **Display**: Image shown on trek detail page

## Accessing Uploaded Images

### Public URL Format
```
https://[project-ref].supabase.co/storage/v1/object/public/trek-images/[filename]
```

### Example
```
https://abcdef123456.supabase.co/storage/v1/object/public/trek-images/trek-1-1705945200000.jpg
```

### Using Supabase SDK
```typescript
const { data: publicUrl } = supabase.storage
  .from('trek-images')
  .getPublicUrl(filePath);
```

## Supported File Types

- **Recommended**: JPG, PNG, WebP
- **Max Size**: 50MB per file
- **Dimensions**: Recommended 1200x800px or larger

## File Naming Convention

Files are named as: `{trek-id}-{timestamp}.{extension}`

Example: `trek-09a7f762-34dc-43ab-8ead-ddc9108d2745-1705945200000.jpg`

## Storage Policies Explained

### Public Read Policy
- Anyone can view/download images
- No authentication required
- Essential for displaying images on website

### Authenticated Upload/Update/Delete
- Only logged-in guides can upload images
- Guides can only modify their own trek images
- Prevents unauthorized uploads

## Troubleshooting

### "Access Denied" Error
- **Problem**: Bucket is private
- **Solution**: Make bucket public or check policies

### Image Not Loading
- **Problem**: URL is incorrect or bucket doesn't exist
- **Solution**: Verify bucket name is exactly `trek-images`

### Upload Fails
- **Problem**: File too large or unsupported format
- **Solution**: Use JPG/PNG/WebP under 50MB

### "Bucket Not Found" Error
- **Problem**: Storage bucket doesn't exist
- **Solution**: Create bucket via dashboard

## File Organization

Inside `trek-images` bucket, files are organized by:
- Trek ID in filename
- Timestamp to ensure uniqueness
- Extension for file type

Example structure:
```
trek-images/
├── trek-1-1705945200000.jpg
├── trek-1-1705945300000.jpg
├── trek-2-1705945400000.png
├── trek-3-1705945500000.jpg
└── ... more images
```

## Bandwidth & Limits

### Free Tier
- 1 GB storage
- 2 GB bandwidth/month
- Good for small operations

### Paid Tier
- Up to 500 GB storage
- Unlimited bandwidth
- Better for production

See Supabase pricing for current limits

## Best Practices

1. **Image Optimization**
   - Compress before upload (JPG: 80-90% quality)
   - Use 1200x800px minimum resolution
   - Keep file size under 500KB if possible

2. **Naming Convention**
   - Always include trek ID
   - Use timestamps for uniqueness
   - Keep filenames simple

3. **Error Handling**
   - Always wrap uploads in try-catch
   - Show user-friendly error messages
   - Log errors for debugging

4. **Performance**
   - Use CDN (Supabase Storage is CDN-backed)
   - Cache images on client-side
   - Lazy load images when possible

## Testing Upload

### Manual Test via Dashboard
1. Go to Storage > trek-images
2. Click "Upload file"
3. Select an image
4. Click upload
5. Copy public URL and test in browser

### Programmatic Test
```typescript
async function testUpload() {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  
  const { error } = await supabase.storage
    .from('trek-images')
    .upload('test.jpg', file);
  
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload successful!');
  }
}
```

## Recovery & Cleanup

### Delete Old Images
```sql
-- Check file size
SELECT name, metadata FROM storage.objects 
WHERE bucket_id = 'trek-images';

-- Note: Deletion is done via dashboard or API
```

### Via Dashboard
1. Go to Storage > trek-images
2. Select image
3. Click delete button
4. Confirm deletion

## Monitoring Storage Usage

Via Dashboard:
1. Go to Settings > Usage
2. Check "Storage" section
3. See total used and bandwidth

## Support

For storage issues:
- Check Supabase documentation: https://supabase.com/docs/guides/storage
- Review error messages carefully
- Test with simple image first
- Check bucket permissions
