-- ========================================
-- 更新 Step 4: 从静态选择改为 AI 对话流程
-- ========================================
-- 注意：重构后，步骤配置已迁移到 onboarding_theme 表

-- 更新 Default Theme 的 step_4_choice 为 AI 对话流程
UPDATE onboarding_theme
SET step_4_choice = '{
  "visual": {
    "background_type": "solid"
  },
  "content": {
    "conversation_flow": [
      {
        "id": 1,
        "ai_question": "Before we begin, tell me - what brings you here today?",
        "user_options": [
          {
            "id": "explore",
            "text": "I want to explore new identities"
          },
          {
            "id": "escape",
            "text": "I need to escape my current reality"
          },
          {
            "id": "curious",
            "text": "Just curious about this experience"
          }
        ],
        "next_question_map": {
          "explore": 2,
          "escape": 2,
          "curious": 2
        }
      },
      {
        "id": 2,
        "ai_question": "Interesting choice. Are you ready to begin your transformation?",
        "user_options": [
          {
            "id": "stay",
            "text": "STAY AS MYSELF",
            "final": true
          },
          {
            "id": "become",
            "text": "BECOME SOMEONE ELSE",
            "final": true
          }
        ]
      }
    ]
  },
  "interaction": {
    "type": "ai_dialogue"
  }
}'::jsonb
WHERE theme_name = 'Default Theme';

-- 验证更新结果
SELECT
  theme_name,
  step_4_choice->'content'->'conversation_flow' as conversation_flow
FROM onboarding_theme
WHERE theme_name = 'Default Theme';
