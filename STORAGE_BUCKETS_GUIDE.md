# Storage Buckets Setup - Boofer Games Platform

## ✅ Created Storage Buckets

### 1. **game-files** bucket
- **Purpose**: Store HTML game files and related assets
- **File Size Limit**: 50 MB per file
- **Public Access**: Yes (anyone can read)
- **Allowed MIME Types**:
  - `text/html`
  - `application/javascript`
  - `text/javascript`
  - `application/json`
  - `text/css`

### 2. **banners** bucket
- **Purpose**: Store game banner images
- **File Size Limit**: 5 MB per file
- **Public Access**: Yes (anyone can read)
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`

---

## 🔐 Security Policies

Both buckets have Row Level Security (RLS) policies configured:

### Read Access
- **Public**: Anyone can view/download files from both buckets

### Upload Access
- **Authenticated users only**: Must be logged in to upload files

### Update/Delete Access
- **Own files only**: Users can only update or delete files they uploaded
- Files are organized by user ID in folder structure: `{user_id}/filename.ext`

---

## 📝 How to Use in Your Next.js App

### 1. Import Supabase Client

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
```

### 2. Upload a Game File

```typescript
async function uploadGameFile(file: File, userId: string) {
  const fileName = `${userId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('game-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading game:', error);
    return null;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('game-files')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

### 3. Upload a Banner Image

```typescript
async function uploadBanner(file: File, userId: string) {
  const fileName = `${userId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('banners')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading banner:', error);
    return null;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('banners')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

### 4. List User's Files

```typescript
async function listUserFiles(userId: string, bucket: 'game-files' | 'banners') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (error) {
    console.error('Error listing files:', error);
    return [];
  }
  
  return data;
}
```

### 5. Delete a File

```typescript
async function deleteFile(filePath: string, bucket: 'game-files' | 'banners') {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  
  return true;
}
```

### 6. Get Public URL

```typescript
function getPublicUrl(filePath: string, bucket: 'game-files' | 'banners') {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
```

---

## 🎮 Example: Complete Upload Component

```typescript
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function GameUploadForm() {
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClientComponentClient();

  async function handleUpload() {
    if (!gameFile || !banner) return;
    
    setUploading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upload game file
      const gameFileName = `${user.id}/${Date.now()}_${gameFile.name}`;
      const { error: gameError } = await supabase.storage
        .from('game-files')
        .upload(gameFileName, gameFile);
      
      if (gameError) throw gameError;
      
      // Upload banner
      const bannerFileName = `${user.id}/${Date.now()}_${banner.name}`;
      const { error: bannerError } = await supabase.storage
        .from('banners')
        .upload(bannerFileName, banner);
      
      if (bannerError) throw bannerError;
      
      // Get public URLs
      const gameUrl = supabase.storage
        .from('game-files')
        .getPublicUrl(gameFileName).data.publicUrl;
      
      const bannerUrl = supabase.storage
        .from('banners')
        .getPublicUrl(bannerFileName).data.publicUrl;
      
      console.log('Game URL:', gameUrl);
      console.log('Banner URL:', bannerUrl);
      
      alert('Upload successful!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div>
        <label>Game File (HTML):</label>
        <input
          type="file"
          accept=".html"
          onChange={(e) => setGameFile(e.target.files?.[0] || null)}
        />
      </div>
      
      <div>
        <label>Banner Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBanner(e.target.files?.[0] || null)}
        />
      </div>
      
      <button onClick={handleUpload} disabled={uploading || !gameFile || !banner}>
        {uploading ? 'Uploading...' : 'Upload Game'}
      </button>
    </div>
  );
}
```

---

## 🌐 Access Your Buckets

You can manage your storage buckets via:

1. **Supabase Dashboard**: https://fvjdohkfaxomtosiibua.supabase.co
   - Navigate to Storage in the left sidebar
   - View, download, or delete files
   - Check storage usage

2. **Supabase CLI**:
   ```bash
   # List files in a bucket
   supabase storage ls game-files --linked
   
   # Download a file
   supabase storage download game-files/path/to/file.html --linked
   
   # Remove a file
   supabase storage rm game-files/path/to/file.html --linked
   ```

---

## 📊 Storage URLs

Your storage buckets are accessible at:
- **Game Files**: `https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/object/public/game-files/`
- **Banners**: `https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/object/public/banners/`

---

## ⚠️ Important Notes

1. **File Organization**: Always organize files by user ID to ensure RLS policies work correctly
2. **File Names**: Use unique names (timestamp + original name) to avoid conflicts
3. **MIME Types**: Only files with allowed MIME types can be uploaded
4. **Size Limits**: Game files max 50MB, banners max 5MB
5. **Authentication**: Users must be authenticated to upload, update, or delete files

---

## 🛠️ Troubleshooting

### "Row Level Security policy violation"
- Ensure user is authenticated
- Verify file path includes user ID: `{userId}/filename.ext`

### "File size exceeds limit"
- Game files: max 50MB
- Banners: max 5MB

### "Invalid MIME type"
- Check allowed MIME types for each bucket
- Ensure file extension matches content type

---

Generated: June 22, 2026
