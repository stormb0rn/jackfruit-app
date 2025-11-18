import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AdminLayout } from './components/layout/AdminLayout'
import { Dashboard } from './pages/Dashboard'
import { Characters } from './pages/character-status/Characters'
import { Assets } from './pages/character-status/Assets'
import { Prompts } from './pages/character-status/Prompts'
import { Statuses } from './pages/character-status/Statuses'
import { StatusEditor } from './pages/character-status/StatusEditor'
import { Transformations } from './pages/lookgen/Transformations'
import { Templates } from './pages/lookgen/Templates'
import { OnboardingConfigs } from './pages/onboarding/OnboardingConfigs'
import { OnboardingThemeEditor } from './pages/onboarding/OnboardingThemeEditor'
import { OnboardingThemeEditorFull } from './pages/onboarding/OnboardingThemeEditorFull'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            {/* Onboarding 管理 */}
            <Route path="onboarding/configs" element={<OnboardingConfigs />} />
            <Route path="onboarding/theme" element={<OnboardingThemeEditor />} />
            <Route path="onboarding/theme-full" element={<OnboardingThemeEditorFull />} />

            {/* LookGen 管理 */}
            <Route path="lookgen/transformations" element={<Transformations />} />
            <Route path="lookgen/templates" element={<Templates />} />

            {/* Character Status 管理 */}
            <Route path="character-status/characters" element={<Characters />} />
            <Route path="character-status/assets" element={<Assets />} />
            <Route path="character-status/prompts" element={<Prompts />} />
            <Route path="character-status/statuses" element={<Statuses />} />
            <Route path="character-status/statuses/new" element={<StatusEditor />} />
            <Route path="character-status/statuses/:statusId" element={<StatusEditor />} />
          </Route>

          {/* 默认重定向到 admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
