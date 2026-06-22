# Fix Storage Buckets - Instructions

## Problem
The buckets `game-files` and `banners` exist in the database but show "bucket not found" in the Supabase web UI. This happens when buckets are created directly via SQL instead of through the Storage API.

## Solution

### Option 1: Use the Node.js Script (Recommended)

1. **Get your Service Role Key**:
   - Go to: https://fvjdohkfaxomtosiibua.supabase.co/project/default/settings/api
   - Copy the `service_role` key (NOT the anon key)

2. **Add it to `.env.local`**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Install dotenv if needed**:
   ```bash
   npm install dotenv
   ```

4. **Run the initialization script**:
   ```bash
   node scripts/init-storage.js
   ```

This will:
- Delete the existing broken buckets
- Recreate them properly via the Storage API
- Verify they work in the web UI

### Option 2: Manual Fix via Supabase Dashboard

1. **Go to Storage in your Supabase Dashboard**:
   https://fvjdohkfaxomtosiibua.supabase.co/project/default/storage/buckets

2. **Try to delete the existing buckets** (they may show as broken):
   - Click on each bucket
   - If you see a delete option, delete them

3. **Create new buckets manually**:

   **For `game-files`:**
   - Click "New bucket"
   - Name: `game-files`
   - Public: ✅ Yes
   - File size limit: 50 MB
   - Allowed MIME types: `text/html`, `application/javascript`, `text/javascript`, `application/json`, `text/css`

   **For `banners`:**
   - Click "New bucket"
   - Name: `banners`
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

4. **Set up RLS policies** (go to Storage Policies):
   - Run the policies from `setup_storage_buckets.sql` (the policy section only)

### Option 3: Use Supabase REST API

If you don't want to add the service role key to your env file:

```bash
# Get your service role key from the dashboard
$SERVICE_KEY = "your_service_role_key"

# Delete existing buckets
curl -X DELETE "https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/bucket/game-files" -H "Authorization: Bearer $SERVICE_KEY"
curl -X DELETE "https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/bucket/banners" -H "Authorization: Bearer $SERVICE_KEY"

# Create game-files bucket
curl -X POST "https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/bucket" -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" -d '{
  "id": "game-files",
  "name": "game-files",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["text/html", "application/javascript", "text/javascript", "application/json", "text/css"]
}'

# Create banners bucket
curl -X POST "https://fvjdohkfaxomtosiibua.supabase.co/storage/v1/bucket" -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" -d '{
  "id": "banners",
  "name": "banners",
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
}'
```

## Verification

After applying any solution:

1. Go to your Supabase Dashboard Storage
2. Click on each bucket - you should see an empty folder, not "bucket not found"
3. Try uploading a test file to verify it works
4. The policies should allow:
   - ✅ Public read access
   - ✅ Authenticated users can upload
   - ✅ Users can manage their own files

## Why Did This Happen?

SQL `INSERT` statements directly into `storage.buckets` create database records but don't initialize the actual storage backend properly. The Storage API must be used to ensure buckets are fully configured in both the database and the storage system.
