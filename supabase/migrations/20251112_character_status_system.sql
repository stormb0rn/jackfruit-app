-- Character Status System Migration
-- Created: 2025-01-12
-- Description: 创建 Character Status 系统所需的所有表

-- 启用 pgcrypto 扩展（用于 gen_random_uuid）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. AI Characters 表
CREATE TABLE IF NOT EXISTS ai_characters (
  character_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Character Assets 表（全局资产库）
CREATE TABLE IF NOT EXISTS character_assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('服饰', '地点', '道具', '其他')),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. System Prompts 表（独立于 transformation_prompts）
CREATE TABLE IF NOT EXISTS system_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('video_generation', 'image_generation', 'text_generation')),
  prompt_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Character Statuses 表（核心）
CREATE TABLE IF NOT EXISTS character_statuses (
  status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES ai_characters(character_id) ON DELETE CASCADE,

  -- 基础信息
  title TEXT NOT NULL,
  mood TEXT NOT NULL,
  status_description TEXT,

  -- 生成步骤追踪
  generation_step INTEGER DEFAULT 0 CHECK (generation_step IN (0, 1, 2, 3)),
  generation_status TEXT DEFAULT 'draft' CHECK (generation_status IN ('draft', 'generating', 'completed', 'failed')),

  -- 关联资产
  selected_asset_ids UUID[] DEFAULT '{}',

  -- Step 1: Gemini 生成的内容
  video_scenes TEXT[] DEFAULT '{}',
  overlays_content JSONB DEFAULT '{}',
  suggestions_list TEXT[] DEFAULT '{}',

  -- Step 2: FAL SeeDrawm 生成的内容
  starting_image_url TEXT,

  -- Step 3: FAL SeeDance 生成的内容
  videos_playlist JSONB DEFAULT '[]',

  -- 元数据
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_statuses_character ON character_statuses(character_id);
CREATE INDEX IF NOT EXISTS idx_statuses_default ON character_statuses(character_id, is_default);
CREATE INDEX IF NOT EXISTS idx_statuses_step ON character_statuses(generation_step);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_characters_updated_at ON ai_characters;
CREATE TRIGGER update_ai_characters_updated_at
  BEFORE UPDATE ON ai_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_prompts_updated_at ON system_prompts;
CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_statuses_updated_at ON character_statuses;
CREATE TRIGGER update_character_statuses_updated_at
  BEFORE UPDATE ON character_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 完成
COMMENT ON TABLE ai_characters IS 'AI 角色基础信息表';
COMMENT ON TABLE character_assets IS '全局资产库（服饰、地点、道具等）';
COMMENT ON TABLE system_prompts IS 'AI 提示词模板';
COMMENT ON TABLE character_statuses IS '角色状态表（核心）';
