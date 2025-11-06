import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function uploadVideo() {
  const videoPath = './public/videos/landing-background.mp4';
  const bucketName = 'videos';
  const fileName = 'landing-background.mp4';

  try {
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`ERROR: Video file not found at ${videoPath}`);
      process.exit(1);
    }

    const fileSize = fs.statSync(videoPath).size;
    console.log(`Uploading video: ${fileName}`);
    console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Read file
    const fileBuffer = fs.readFileSync(videoPath);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'video/mp4'
      });

    if (error) {
      console.error('Upload failed:', error);
      process.exit(1);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('✓ Upload successful!');
    console.log('Public URL:', urlData.publicUrl);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

uploadVideo();
