-- Onboarding System Migration
-- Created: 2025-11-18
-- Description: 创建 Onboarding 配置和会话系统

-- ========================================
-- 1. Onboarding 配置表
-- ========================================
CREATE TABLE IF NOT EXISTS onboarding_configs (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 配置元信息
  config_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,

  -- 流程类型
  flow_type TEXT CHECK (flow_type IN ('fixed_character', 'user_creation')),
  target_character_id UUID REFERENCES ai_characters(character_id) ON DELETE SET NULL,

  -- 全局样式配置
  global_styles JSONB DEFAULT '{
    "font_family": "''VT323'', monospace",
    "primary_color": "#00FF41",
    "background_overlay": "rgba(0, 0, 0, 0.7)",
    "animation_speed": "medium"
  }'::jsonb,

  -- 7步骤配置（简化版 - DEMO）
  step_1_splash JSONB NOT NULL DEFAULT '{
    "step_id": "splash",
    "visual": {
      "background_type": "video",
      "background_url": ""
    },
    "content": {
      "title": "START YOUR SECOND LIFE",
      "lines": ["> WELCOME."]
    },
    "interaction": {
      "type": "button",
      "button_text": "[ INITIATE ]"
    }
  }'::jsonb,

  step_2_guidance JSONB DEFAULT '{}'::jsonb,
  step_3_identity_input JSONB DEFAULT '{}'::jsonb,
  step_4_choice JSONB DEFAULT '{}'::jsonb,
  step_5_creation JSONB DEFAULT '{}'::jsonb,
  step_6_finalizing JSONB DEFAULT '{}'::jsonb,

  step_7_entry JSONB NOT NULL DEFAULT '{
    "step_id": "entry",
    "visual": {
      "background_type": "video",
      "background_url": ""
    },
    "content": {
      "title": "WELCOME TO YOUR SECOND LIFE",
      "subtitle": "CLICK ANYWHERE TO ENTER"
    },
    "interaction": {
      "type": "any_click",
      "redirect_delay": 500
    }
  }'::jsonb,

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 确保只有一个激活配置
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_onboarding_config
  ON onboarding_configs(is_active)
  WHERE is_active = true;

-- 索引
CREATE INDEX IF NOT EXISTS idx_onboarding_configs_active ON onboarding_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_onboarding_configs_flow_type ON onboarding_configs(flow_type);

-- ========================================
-- 2. Onboarding 会话表（用户数据）
-- ========================================
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联配置
  config_id UUID REFERENCES onboarding_configs(config_id) ON DELETE CASCADE,

  -- 用户输入数据（DEMO 阶段暂不收集）
  user_name TEXT,
  user_photo_url TEXT,
  user_voice_url TEXT,
  user_choice TEXT,
  user_creation_prompt TEXT,

  -- 会话状态
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 7),
  completed BOOLEAN DEFAULT FALSE,

  -- 元数据
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_config ON onboarding_sessions(config_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_completed ON onboarding_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_created ON onboarding_sessions(created_at DESC);

-- ========================================
-- 3. 更新时间触发器
-- ========================================
-- 复用现有的 update_updated_at_column 函数
CREATE TRIGGER update_onboarding_configs_updated_at
  BEFORE UPDATE ON onboarding_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. RLS (Row Level Security) 策略
-- ========================================
-- 允许匿名读取激活的配置
ALTER TABLE onboarding_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read active config"
  ON onboarding_configs
  FOR SELECT
  TO anon
  USING (is_active = true);

-- 允许匿名创建和更新会话
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert sessions"
  ON onboarding_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update own sessions"
  ON onboarding_sessions
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read own sessions"
  ON onboarding_sessions
  FOR SELECT
  TO anon
  USING (true);

-- ========================================
-- 5. 创建存储桶（如果不存在）
-- ========================================
-- Onboarding 资源存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-resources', 'onboarding-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Onboarding 用户上传存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-uploads', 'onboarding-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略：允许公开读取 onboarding-resources
CREATE POLICY "Allow public read onboarding resources"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'onboarding-resources');

-- 存储桶策略：允许匿名上传到 onboarding-uploads
CREATE POLICY "Allow anonymous upload onboarding files"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'onboarding-uploads');
