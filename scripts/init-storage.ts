/**
 * Initialize Supabase Storage Buckets
 * Run this script to properly create storage buckets via the Storage API
 * 
 * Usage: npx tsx scripts/init-storage.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function initStorageBuckets() {
  console.log('🚀 Initializing Supabase Storage Buckets...\n')

  // Delete existing buckets if they exist (to recreate properly)
  const bucketsToCreate = ['game-files', 'banners']
  
  for (const bucketId of bucketsToCreate) {
    console.log(`📦 Checking bucket: ${bucketId}`)
    
    // Try to get bucket info
    const { data: existingBucket } = await supabase.storage.getBucket(bucketId)
    
    if (existingBucket) {
      console.log(`  ℹ️  Bucket exists, deleting to recreate...`)
      const { error: deleteError } = await supabase.storage.deleteBucket(bucketId)
      if (deleteError) {
        console.error(`  ❌ Error deleting bucket: ${deleteError.message}`)
      } else {
        console.log(`  ✅ Deleted successfully`)
      }
    }
  }

  console.log('')

  // Create game-files bucket
  console.log('📦 Creating bucket: game-files')
  const { data: gameFilesBucket, error: gameFilesError } = await supabase.storage.createBucket('game-files', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'text/html',
      'application/javascript',
      'text/javascript',
      'application/json',
      'text/css'
    ]
  })

  if (gameFilesError) {
    console.error(`  ❌ Error: ${gameFilesError.message}`)
  } else {
    console.log(`  ✅ Created successfully`)
    console.log(`  📋 Config: Public, 50MB limit, HTML/JS/CSS files`)
  }

  // Create banners bucket
  console.log('\n📦 Creating bucket: banners')
  const { data: bannersBucket, error: bannersError } = await supabase.storage.createBucket('banners', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]
  })

  if (bannersError) {
    console.error(`  ❌ Error: ${bannersError.message}`)
  } else {
    console.log(`  ✅ Created successfully`)
    console.log(`  📋 Config: Public, 5MB limit, Image files`)
  }

  // List all buckets to verify
  console.log('\n📋 Verifying buckets...')
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error(`❌ Error listing buckets: ${listError.message}`)
  } else {
    console.log(`✅ Found ${buckets?.length} buckets:`)
    buckets?.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
    })
  }

  console.log('\n🎉 Storage initialization complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Check your Supabase dashboard Storage section')
  console.log('2. Verify buckets appear correctly in the web UI')
  console.log('3. Test uploading a file to each bucket')
}

initStorageBuckets().catch(console.error)
