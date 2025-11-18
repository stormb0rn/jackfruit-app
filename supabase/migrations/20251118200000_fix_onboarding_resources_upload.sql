-- Fix onboarding-resources bucket upload permission
-- Created: 2025-11-18
-- Description: 允许匿名用户上传文件到 onboarding-resources bucket (用于 Admin Panel)

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow anonymous upload onboarding resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload onboarding resources" ON storage.objects;

-- 允许匿名用户上传到 onboarding-resources
-- 注意: 生产环境应该使用认证用户或服务角色
CREATE POLICY "Allow anonymous upload onboarding resources"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'onboarding-resources');

-- 允许匿名用户更新 onboarding-resources 中的文件
CREATE POLICY "Allow anonymous update onboarding resources"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'onboarding-resources');

-- 允许匿名用户删除 onboarding-resources 中的文件
CREATE POLICY "Allow anonymous delete onboarding resources"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'onboarding-resources');
