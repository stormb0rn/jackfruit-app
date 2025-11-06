import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

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

// Load JSON configs
const configPath = path.join(__dirname, '../src/config');
const transformationPromptsPath = path.join(configPath, 'transformation_prompts.json');
const styleTemplatesPath = path.join(configPath, 'style_templates.json');

const transformationConfig = JSON.parse(fs.readFileSync(transformationPromptsPath, 'utf8'));
const stylesConfig = JSON.parse(fs.readFileSync(styleTemplatesPath, 'utf8'));

async function migrateData() {
  console.log('🚀 Starting data migration to prompt_items table...\n');

  try {
    const itemsToInsert = [];

    // Process looking/edit options
    console.log('📝 Processing Edit Look options...');
    const editOptions = transformationConfig.edit_options || {};
    Object.entries(editOptions).forEach(([key, option]) => {
      itemsToInsert.push({
        id: option.id,
        category: 'looking',
        name: option.name,
        prompts: [option.prompt], // Single prompt as array
        enabled: option.enabled !== undefined ? option.enabled : true,
        display_order: option.order !== undefined ? option.order : 0,
        deleted_at: null,
      });
    });
    console.log(`   ✅ Found ${Object.keys(editOptions).length} Edit Look options\n`);

    // Process style templates
    console.log('📝 Processing Style Templates...');
    const templates = stylesConfig.templates || {};
    Object.entries(templates).forEach(([key, template]) => {
      itemsToInsert.push({
        id: template.id,
        category: 'templates',
        name: template.name,
        prompts: [template.prompt, template.prompt, template.prompt], // 3 identical prompts initially
        image_path: template.image || null,
        enabled: template.enabled !== undefined ? template.enabled : true,
        display_order: template.order !== undefined ? template.order : 0,
        deleted_at: null,
      });
    });
    console.log(`   ✅ Found ${Object.keys(templates).length} Style Templates\n`);

    // Insert all items
    console.log(`📤 Inserting ${itemsToInsert.length} items into prompt_items table...`);
    const { error: insertError } = await supabase
      .from('prompt_items')
      .insert(itemsToInsert);

    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      process.exit(1);
    }

    console.log('✅ Successfully inserted all items\n');

    // Verify insertion
    console.log('🔍 Verifying data...');
    const { data: lookingItems, error: lookingError } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('category', 'looking')
      .is('deleted_at', null);

    const { data: templateItems, error: templateError } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('category', 'templates')
      .is('deleted_at', null);

    if (lookingError || templateError) {
      console.error('❌ Verification error:', lookingError || templateError);
      process.exit(1);
    }

    console.log(`   ✅ Edit Look items: ${lookingItems?.length || 0}`);
    console.log(`   ✅ Template items: ${templateItems?.length || 0}`);
    console.log(`   ✅ Total items: ${(lookingItems?.length || 0) + (templateItems?.length || 0)}\n`);

    // Show summary
    console.log('═════════════════════════════════════════════════');
    console.log('🎉 Migration Complete!');
    console.log('═════════════════════════════════════════════════');
    console.log(`\n✅ Old prompt_config table has been dropped`);
    console.log(`✅ New prompt_items table contains all ${(lookingItems?.length || 0) + (templateItems?.length || 0)} items`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Edit Look options: ${lookingItems?.length || 0}`);
    console.log(`   - Style Templates: ${templateItems?.length || 0}`);
    console.log(`   - Total: ${(lookingItems?.length || 0) + (templateItems?.length || 0)} items\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

migrateData();
