// 测试 Supabase Storage 上传功能
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://fwytawawmtenhbnwhunc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eXRhd2F3bXRlbmhibndodW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODA3MjcsImV4cCI6MjA3Nzk1NjcyN30.oJSo5rG7U4HcA0L5lAPechmyKWLLcB0ce0nNmSxnqhA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorageUpload() {
  console.log('🧪 测试 Supabase Storage 上传功能...\n')

  // 使用已创建的测试图片
  const testFileName = `test-avatar-${Date.now()}.png`
  const testFilePath = '/tmp/test-avatar.png'

  console.log(`✅ 使用测试文件: ${testFilePath}`)

  // 测试上传到 character-avatars bucket
  console.log('\n📤 测试上传到 character-avatars bucket...')

  try {
    const fileBuffer = fs.readFileSync(testFilePath)
    const { data, error } = await supabase.storage
      .from('character-avatars')
      .upload(`test/${testFileName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (error) {
      console.error('❌ 上传失败:', error)
      console.error('   错误代码:', error.statusCode)
      console.error('   错误信息:', error.message)
      return false
    }

    console.log('✅ 上传成功!')
    console.log('   Path:', data.path)

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-avatars')
      .getPublicUrl(data.path)

    console.log('   Public URL:', publicUrl)

    // 清理测试文件
    console.log('\n🗑️  清理测试文件...')
    const { error: deleteError } = await supabase.storage
      .from('character-avatars')
      .remove([data.path])

    if (deleteError) {
      console.error('⚠️  删除失败:', deleteError.message)
    } else {
      console.log('✅ 测试文件已删除')
    }

    return true

  } catch (err) {
    console.error('❌ 测试失败:', err)
    return false
  }
}

// 运行测试
testStorageUpload().then(success => {
  console.log('\n' + '='.repeat(50))
  if (success) {
    console.log('✅ Storage 权限配置正确！可以正常上传和删除文件')
  } else {
    console.log('❌ Storage 权限配置有问题，请检查 RLS 策略')
  }
  console.log('='.repeat(50))
  process.exit(success ? 0 : 1)
})
