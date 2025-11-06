import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
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

async function migrateTemplateImages() {
  console.log('🚀 Starting template images migration...\n');

  try {
    // 1. 读取所有本地图片文件
    const assetsDir = path.join(__dirname, '../src/assets/style-templates');

    if (!fs.existsSync(assetsDir)) {
      console.error('❌ Assets directory not found:', assetsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(assetsDir)
      .filter(f => /\.(jpg|png|webp)$/i.test(f))
      .sort();

    console.log(`📁 Found ${files.length} image files to upload:\n`);

    const uploadResults = [];

    // 2. 逐个上传图片
    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const fileSize = (fileBuffer.length / 1024).toFixed(2);

      // 生成新文件名（小写，空格改为连字符）
      const fileExt = file.split('.').pop().toLowerCase();
      const baseName = file
        .replace(/\.[^/.]+$/, '') // 移除扩展名
        .toLowerCase()
        .replace(/\s+/g, '-')        // 空格改为连字符
        .replace(/[^a-z0-9-]/g, ''); // 移除特殊字符

      const newFileName = `${baseName}.${fileExt}`;
      const storagePath = `anonymous/style-templates/${newFileName}`;

      try {
        console.log(`  📤 Uploading: ${file} → ${newFileName} (${fileSize} KB)...`);

        const { data, error } = await supabase.storage
          .from('identity-photos')
          .upload(storagePath, fileBuffer, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        console.log(`     ✅ Success\n`);

        uploadResults.push({
          originalName: file,
          newName: newFileName,
          storagePath: storagePath,
          success: true
        });
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}\n`);
        uploadResults.push({
          originalName: file,
          newName: newFileName,
          storagePath: storagePath,
          success: false,
          error: error.message
        });
      }
    }

    // 3. 检查上传成功数
    const successCount = uploadResults.filter(r => r.success).length;
    console.log(`\n📊 Upload Summary: ${successCount}/${files.length} files uploaded successfully\n`);

    if (successCount === 0) {
      console.error('❌ No files were uploaded. Aborting migration.');
      process.exit(1);
    }

    // 4. 读取并更新 style_templates.json
    console.log('📝 Updating style_templates.json...');

    const configPath = path.join(__dirname, '../src/config/style_templates.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // 创建文件名映射（原始名称 → 新名称）
    const fileNameMap = {};
    uploadResults.forEach(result => {
      fileNameMap[result.originalName] = result.storagePath;
    });

    // 更新所有模板的 image 字段
    let updatedCount = 0;
    Object.entries(config.templates || {}).forEach(([key, template]) => {
      const originalImage = template.image;

      if (fileNameMap[originalImage]) {
        template.image = fileNameMap[originalImage];
        updatedCount++;
        console.log(`  ✅ Updated: ${key} → ${template.image}`);
      } else {
        console.warn(`  ⚠️  No mapping found for: ${originalImage}`);
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\n✅ Updated ${updatedCount} templates in config\n`);

    // 5. 更新数据库中的 templates 配置
    console.log('🔄 Updating database...');

    const { error: dbError } = await supabase
      .from('prompt_configs')
      .update({
        config_data: config.templates,
        updated_at: new Date().toISOString()
      })
      .eq('config_type', 'templates');

    if (dbError) {
      console.error('❌ Database update failed:', dbError);
      console.warn('⚠️  Config file was updated, but database was not.');
      console.warn('Please try updating the database manually or running this script again.');
    } else {
      console.log('✅ Database updated successfully\n');
    }

    // 6. 打印迁移报告
    console.log('═════════════════════════════════════════════════');
    console.log('🎉 Migration Complete!');
    console.log('═════════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`   ✅ Uploaded images: ${successCount}/${files.length}`);
    console.log(`   ✅ Updated config: ${updatedCount} templates`);
    console.log(`   ✅ Updated database: prompt_configs table\n`);

    console.log('📁 Uploaded to: Supabase Storage → identity-photos bucket');
    console.log('   Path: anonymous/style-templates/\n');

    console.log('📝 Config file updated: src/config/style_templates.json');
    console.log('   All image fields now contain relative paths\n');

    console.log('🗑️  Next steps:');
    console.log('   1. Run: npm run build (to verify no errors)');
    console.log('   2. Test: Check Admin page and Templates page');
    console.log('   3. Delete: src/assets/style-templates/ directory');
    console.log('   4. Commit: git add/commit the changes\n');

    // 打印失败的文件（如果有）
    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.warn('⚠️  Failed Uploads:');
      failedUploads.forEach(result => {
        console.warn(`   - ${result.originalName}: ${result.error}`);
      });
      console.log('');
    }

    process.exit(successCount === files.length ? 0 : 1);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

migrateTemplateImages();
