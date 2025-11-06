import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=');
    envVars[key] = value;
  }
});

// Initialize Supabase client
const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

// File mapping: original filename → new filename
const fileMap = {
  'Camera Lens.jpg': { newName: 'camera-lens.jpg', type: 'image/jpeg' },
  'Cinematic.jpg': { newName: 'cinematic.jpg', type: 'image/jpeg' },
  'Classy.jpg': { newName: 'classy.jpg', type: 'image/jpeg' },
  'Creative.jpg': { newName: 'creative.jpg', type: 'image/jpeg' },
  'Daily.jpg': { newName: 'daily.jpg', type: 'image/jpeg' },
  'Edgy.jpg': { newName: 'edgy.jpg', type: 'image/jpeg' },
  'Editorial.jpg': { newName: 'editorial.jpg', type: 'image/jpeg' },
  'Funny.jpg': { newName: 'funny.jpg', type: 'image/jpeg' },
  'Retro Vintage.jpg': { newName: 'retro-vintage.jpg', type: 'image/jpeg' },
  'The Cool One.jpg': { newName: 'the-cool-one.jpg', type: 'image/jpeg' },
  'The Cute One.jpg': { newName: 'the-cute-one.jpg', type: 'image/jpeg' },
  'The Hot One.jpg': { newName: 'the-hot-one.jpg', type: 'image/jpeg' },
  'Vintage.png': { newName: 'vintage.png', type: 'image/png' },
  'Y2K.jpg': { newName: 'y2k.jpg', type: 'image/jpeg' }
};

async function uploadTemplateImages() {
  console.log('🚀 Starting template images upload...\n');

  try {
    const assetsDir = '/tmp/template-images';

    if (!fs.existsSync(assetsDir)) {
      console.error('❌ Assets directory not found:', assetsDir);
      process.exit(1);
    }

    const uploadResults = [];
    let successCount = 0;

    for (const [originalName, { newName, type }] of Object.entries(fileMap)) {
      const filePath = path.join(assetsDir, originalName);

      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠️  File not found: ${originalName}`);
        uploadResults.push({
          originalName,
          newName,
          success: false,
          error: 'File not found'
        });
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileSize = (fileBuffer.length / 1024).toFixed(2);
      const storagePath = `anonymous/style-templates/${newName}`;

      try {
        console.log(`  📤 Uploading: ${originalName} → ${newName} (${fileSize} KB)...`);

        // Use Blob to properly set MIME type
        const blob = new Blob([fileBuffer], { type });

        const { data, error } = await supabase.storage
          .from('identity-photos')
          .upload(storagePath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: type
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        console.log(`     ✅ Success\n`);
        successCount++;

        uploadResults.push({
          originalName,
          newName,
          storagePath,
          success: true
        });
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}\n`);
        uploadResults.push({
          originalName,
          newName,
          storagePath,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`\n📊 Upload Summary: ${successCount}/${Object.keys(fileMap).length} files uploaded successfully\n`);

    if (successCount > 0) {
      console.log('═════════════════════════════════════════════════');
      console.log('🎉 Upload Complete!');
      console.log('═════════════════════════════════════════════════\n');

      console.log('📁 Uploaded to: Supabase Storage → identity-photos bucket');
      console.log('   Path: anonymous/style-templates/\n');

      console.log('✅ Template images are now available via Supabase URLs\n');
    }

    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.warn('⚠️  Failed Uploads:');
      failedUploads.forEach(result => {
        console.warn(`   - ${result.originalName}: ${result.error}`);
      });
      console.log('');
    }

    process.exit(successCount === Object.keys(fileMap).length ? 0 : 1);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

uploadTemplateImages();
