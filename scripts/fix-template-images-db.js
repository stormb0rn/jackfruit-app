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

// Load template config from JSON
const configPath = path.join(__dirname, '../src/config/style_templates.json');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configContent);

async function updateTemplatesInDatabase() {
  console.log('🚀 Starting to update template configurations in Supabase...\n');

  try {
    // Get current config from Supabase
    const { data: currentData, error: fetchError } = await supabase
      .from('prompt_config')
      .select('config_data')
      .eq('id', 'templates')
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch templates config:', fetchError.message);
      process.exit(1);
    }

    let currentTemplates = currentData?.config_data || {};
    console.log(`📊 Current templates in database: ${Object.keys(currentTemplates).length}`);

    // Merge with JSON config to ensure image fields are present
    const mergedTemplates = {};
    Object.entries(config.templates).forEach(([key, template]) => {
      mergedTemplates[key] = {
        ...currentTemplates[key],  // Keep any existing database data
        ...template  // Override with JSON config (includes image field)
      };
    });

    console.log(`📝 Merged templates: ${Object.keys(mergedTemplates).length}`);

    // Show what images will be saved
    console.log('\n📸 Template images that will be saved:');
    Object.entries(mergedTemplates).forEach(([key, template]) => {
      console.log(`  - ${template.name}: ${template.image || 'NO IMAGE'}`);
    });

    // Update Supabase
    const { error: updateError } = await supabase
      .from('prompt_config')
      .upsert({
        id: 'templates',
        config_type: 'templates',
        config_data: mergedTemplates,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('❌ Failed to update templates in database:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ Successfully updated all templates in Supabase!');
    console.log(`   Total templates updated: ${Object.keys(mergedTemplates).length}`);
    console.log('   All templates now have image fields from the JSON config');

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('prompt_config')
      .select('config_data')
      .eq('id', 'templates')
      .single();

    if (!verifyError && verifyData) {
      const savedTemplates = verifyData.config_data;
      const templatesWithImages = Object.values(savedTemplates).filter(t => t.image).length;
      console.log(`\n✓ Verification: ${templatesWithImages}/${Object.keys(savedTemplates).length} templates have image fields`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

updateTemplatesInDatabase();
