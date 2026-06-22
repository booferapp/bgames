/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Initialize Supabase Storage Buckets
 * Run this script to properly create storage buckets via the Storage API
 * 
 * Usage: node scripts/init-storage.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('ℹ️  Get your service role key from: https://fvjdohkfaxomtosiibua.supabase.co/project/default/settings/api')
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

  const bucketsToCreate = [
    {
      id: 'game-files',
      config: {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'text/html',
          'application/javascript',
          'text/javascript',
          'application/json',
          'text/css'
        ]
      },
      description: 'Public, 50MB limit, HTML/JS/CSS files'
    },
    {
      id: 'banners',
      config: {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ]
      },
      description: 'Public, 5MB limit, Image files'
    }
  ]

  // Delete and recreate each bucket
  for (const bucket of bucketsToCreate) {
    console.log(`📦 Processing bucket: ${bucket.id}`)
    
    // Try to get bucket info
    const { data: existingBucket } = await supabase.storage.getBucket(bucket.id)
    
    if (existingBucket) {
      console.log(`  ℹ️  Bucket exists, deleting to recreate...`)
      const { error: deleteError } = await supabase.storage.deleteBucket(bucket.id)
      if (deleteError) {
        console.error(`  ❌ Error deleting bucket: ${deleteError.message}`)
        continue
      } else {
        console.log(`  ✅ Deleted successfully`)
      }
    }

    // Create the bucket
    console.log(`  🔨 Creating bucket...`)
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(
      bucket.id,
      bucket.config
    )

    if (createError) {
      console.error(`  ❌ Error: ${createError.message}`)
    } else {
      console.log(`  ✅ Created successfully`)
      console.log(`  📋 Config: ${bucket.description}`)
    }
    console.log('')
  }

  // List all buckets to verify
  console.log('📋 Verifying buckets...')
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error(`❌ Error listing buckets: ${listError.message}`)
  } else {
    console.log(`✅ Found ${buckets?.length || 0} buckets:`)
    buckets?.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'}, Size Limit: ${bucket.file_size_limit ? Math.round(bucket.file_size_limit / 1024 / 1024) + 'MB' : 'None'})`)
    })
  }

  console.log('\n🎉 Storage initialization complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Refresh your Supabase dashboard Storage section')
  console.log('2. Verify buckets appear correctly in the web UI')
  console.log('3. Test uploading a file to each bucket')
}

initStorageBuckets().catch(console.error)
