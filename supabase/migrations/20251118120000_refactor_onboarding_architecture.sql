-- =============================================
-- Onboarding 架构重构：分离角色配置和样式配置
-- =============================================

-- 步骤 1: 创建新的 onboarding_theme 表（样式主题）
CREATE TABLE IF NOT EXISTS onboarding_theme (
  theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name TEXT NOT NULL DEFAULT 'Default Theme',

  -- 全局样式配置
  global_styles JSONB DEFAULT '{
    "font_family": "''VT323'', monospace",
    "primary_color": "#00FF41",
    "background_overlay": "rgba(0, 0, 0, 0.7)",
    "animation_speed": "medium"
  }'::jsonb,

  -- 各步骤的样式配置
  step_1_splash JSONB,
  step_2_guidance JSONB,
  step_3_identity_input JSONB,
  step_4_choice JSONB,
  step_5_creation JSONB,
  step_6_finalizing JSONB,
  step_7_entry JSONB,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 步骤 2: 迁移现有 onboarding_configs 数据到 onboarding_theme
DO $$
DECLARE
  existing_config RECORD;
  new_theme_id UUID;
BEGIN
  -- 查找第一个激活的配置
  SELECT * INTO existing_config
  FROM onboarding_configs
  WHERE is_active = true
  LIMIT 1;

  IF FOUND THEN
    -- 创建默认主题，使用现有配置的样式数据
    INSERT INTO onboarding_theme (
      theme_name,
      global_styles,
      step_1_splash,
      step_2_guidance,
      step_3_identity_input,
      step_4_choice,
      step_5_creation,
      step_6_finalizing,
      step_7_entry
    ) VALUES (
      'Default Theme',
      COALESCE(existing_config.global_styles, '{
        "font_family": "''VT323'', monospace",
        "primary_color": "#00FF41",
        "background_overlay": "rgba(0, 0, 0, 0.7)",
        "animation_speed": "medium"
      }'::jsonb),
      existing_config.step_1_splash,
      existing_config.step_2_guidance,
      existing_config.step_3_identity_input,
      existing_config.step_4_choice,
      existing_config.step_5_creation,
      existing_config.step_6_finalizing,
      existing_config.step_7_entry
    )
    RETURNING theme_id INTO new_theme_id;

    RAISE NOTICE 'Created default theme with ID: %', new_theme_id;
  ELSE
    -- 如果没有现有配置，创建空的默认主题
    INSERT INTO onboarding_theme (theme_name)
    VALUES ('Default Theme')
    RETURNING theme_id INTO new_theme_id;

    RAISE NOTICE 'Created empty default theme with ID: %', new_theme_id;
  END IF;
END $$;

-- 步骤 3: 修改 onboarding_configs 表结构
-- 备份原表（可选，用于回滚）
CREATE TABLE IF NOT EXISTS onboarding_configs_backup AS
SELECT * FROM onboarding_configs;

-- 删除步骤相关列
ALTER TABLE onboarding_configs
  DROP COLUMN IF EXISTS global_styles,
  DROP COLUMN IF EXISTS step_1_splash,
  DROP COLUMN IF EXISTS step_2_guidance,
  DROP COLUMN IF EXISTS step_3_identity_input,
  DROP COLUMN IF EXISTS step_4_choice,
  DROP COLUMN IF EXISTS step_5_creation,
  DROP COLUMN IF EXISTS step_6_finalizing,
  DROP COLUMN IF EXISTS step_7_entry;

-- 步骤 4: 添加 RLS 策略
ALTER TABLE onboarding_theme ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取主题
CREATE POLICY "Allow anonymous read onboarding_theme"
  ON onboarding_theme
  FOR SELECT
  TO anon
  USING (true);

-- 允许认证用户管理主题（未来如果需要）
CREATE POLICY "Allow authenticated manage onboarding_theme"
  ON onboarding_theme
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 步骤 5: 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_onboarding_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_theme_updated_at
  BEFORE UPDATE ON onboarding_theme
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_theme_updated_at();

-- 步骤 6: 添加注释
COMMENT ON TABLE onboarding_theme IS '存储 Onboarding 流程的视觉样式主题配置';
COMMENT ON COLUMN onboarding_theme.global_styles IS '全局样式配置（字体、颜色等）';
COMMENT ON COLUMN onboarding_theme.step_1_splash IS 'Step 1: 启动与世界观 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_2_guidance IS 'Step 2: 助手引导 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_3_identity_input IS 'Step 3: 身份输入 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_4_choice IS 'Step 4: 核心选择 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_5_creation IS 'Step 5: 身份创造 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_6_finalizing IS 'Step 6: 确认与加载 的样式配置';
COMMENT ON COLUMN onboarding_theme.step_7_entry IS 'Step 7: 进入世界 的样式配置';

COMMENT ON TABLE onboarding_configs IS '存储 Onboarding 流程的全局配置（角色选择、流程类型）';
COMMENT ON COLUMN onboarding_configs.target_character_id IS '固定角色模式下的目标角色 ID';
COMMENT ON COLUMN onboarding_configs.flow_type IS '流程类型：fixed_character（固定角色）或 user_creation（用户创建）';
