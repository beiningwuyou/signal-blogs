import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { Drawer } from './components/Drawer.jsx';
import { DailyPage } from './pages/DailyPage.jsx';
import { FollowingPage } from './pages/FollowingPage.jsx';
import { ReadingPage } from './pages/ReadingPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { ReviewPage } from './pages/ReviewPage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { WeeklyPage } from './pages/WeeklyPage.jsx';
import { TopicsPage } from './pages/TopicsPage.jsx';
import { TimelinePage } from './pages/TimelinePage.jsx';
import { PersonalDailyPage } from './pages/PersonalDailyPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

export function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          {/* 默认进入私人早报 */}
          <Route index element={<Navigate to="/personal" replace />} />

          {/* 个人空间 5 核心模块 */}
          <Route path="personal" element={<PersonalDailyPage />} />
          <Route path="following" element={<FollowingPage />} />
          <Route path="reading" element={<ReadingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="review" element={<ReviewPage />} />

          {/* 公共广场 5 核心模块 */}
          <Route path="explore" element={<ExplorePage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="daily/:date" element={<DailyPage />} />
          <Route path="weekly" element={<WeeklyPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="timeline" element={<TimelinePage />} />

          {/* 底层系统与设置 */}
          <Route path="settings" element={<SettingsPage />} />

          {/* 兼容历史旧路由重定向 */}
          <Route path="events" element={<Navigate to="/following" replace />} />
          <Route path="all" element={<Navigate to="/following" replace />} />
          <Route path="bookmarks" element={<Navigate to="/reading" replace />} />

          {/* 404 容错 */}
          <Route
            path="*"
            element={
              <div className="py-20 text-center space-y-4">
                <h1 className="text-2xl font-serif font-bold text-ink">没有找到这个页面</h1>
                <p className="text-muted text-sm">你访问的地址不存在或已被迁移。</p>
                <div>
                  <Link
                    to="/personal"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    返回私人早报
                  </Link>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
      <Drawer />
    </>
  );
}
