import React, { Suspense, lazy, useState } from 'react';
import Login from './components/login';
import PixelDialog from './components/PixelDialog';
import StudentHome from './components/StudentHome';

// 🌟 正式測驗與老師後台點進去才下載，學生登入頁、主頁不用先載入這些程式
const Quiz = lazy(() => import('./components/Quiz'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const PageLoading = () => <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.5rem', color: '#4a4a4a' }}>⏳ 載入中...</div>;
import { useVersionCheck } from './hooks/useVersionCheck';
import { isEmbeddedInAppBrowser } from './utils/browserDetect';
import { useIsMobile } from './hooks/useIsMobile';

import './index.css'; 

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      // 🌟 學生看到的是好懂的像素卡片；技術細節收在「給老師看」裡，需要時再展開
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#f2efeb', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', color: '#4a4a4a' }}>
          <div className="pixel-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>😅 糟糕，畫面卡住了</h2>
            <p style={{ fontSize: '1.2rem', lineHeight: 1.5, margin: '0 0 20px' }}>按下面的按鈕再試一次。<br />如果一直出現，請告訴老師。</p>
            <button className="pixel-btn btn-blue" style={{ width: '100%', minHeight: '56px', fontSize: '1.4rem' }} onClick={() => window.location.reload()}>
              🔄 再試一次
            </button>
            <details style={{ marginTop: '20px', textAlign: 'left', fontSize: '0.95rem' }}>
              <summary style={{ cursor: 'pointer' }}>給老師看的錯誤資訊</summary>
              <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
              <pre style={{ overflowX: 'auto', fontSize: '0.8rem', backgroundColor: '#fff', padding: '10px', border: '3px solid #4a4a4a' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("studentHome");
  const [quizConfig, setQuizConfig] = useState(null);
  const [homeTab, setHomeTab] = useState('quiz'); // 從測驗結算頁按「去商城」時，手機版直接打開商城分頁
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const hasUpdate = useVersionCheck();
  const isMobile = useIsMobile();

  // 🌟 不只擋 LINE：舉凡 FB/IG/微信/Android 系統 WebView 等內嵌瀏覽器都會被 Google 擋下登入，
  // 常見於平板用某些「QR Code 掃描」App 直接開連結的情況，統一在這裡先攔下來並提示切換瀏覽器
  const isInAppBrowser = isEmbeddedInAppBrowser();

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView("studentHome");
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setCurrentUser(null);
    setCurrentView("studentHome");
  };

  const TEACHER_EMAIL = "fr80770055re@gmail.com"; 
  const isTeacher = currentUser && currentUser.email === TEACHER_EMAIL;

  if (!currentUser && isInAppBrowser) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2efeb' }}>
        <div className="pixel-card" style={{ backgroundColor: '#fff', padding: 'clamp(20px, 6vw, 50px)', textAlign: 'center', maxWidth: '90%', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.5rem)', color: '#4a4a4a', marginBottom: '20px' }}>⚠️ 請切換瀏覽器</h1>
          <p style={{ fontSize: '1.2rem', color: '#4a4a4a', marginBottom: '20px', lineHeight: '1.5' }}>
            目前這個畫面是被 LINE、Facebook 或某些「掃 QR Code」App 內建的瀏覽器打開的，安全限制下無法登入 Google 帳號。
          </p>
          <div style={{ backgroundColor: '#fdf6e3', padding: '15px', border: '3px dashed #4a4a4a', textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>👉 請依照以下步驟操作：</p>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li>點擊右上角的 <strong>[⋮]</strong> 或 <strong>[⎋]</strong> 圖示</li>
              <li>選擇 <strong>「使用預設瀏覽器開啟」</strong> 或 <strong>「在 Safari 中開啟」</strong></li>
              <li>如果掃 QR Code 進來的，也可以改用手機/平板內建的「相機」App 直接掃，會自動用系統瀏覽器開啟</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    // 🌟 完全移除黑邊，改為全螢幕滿版的淺色背景
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f2efeb' }}>
      {/* 作答中不顯示，免得孩子答到一半按重新整理，進度就不見了 */}
      {hasUpdate && !updateDismissed && currentView !== 'quiz' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '8px' : '15px', flexWrap: 'wrap',
          padding: isMobile ? '8px 12px' : '10px 20px', backgroundColor: '#d6b75a', color: '#4a4a4a',
          fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', fontSize: '1.1rem', fontWeight: 'bold',
          borderBottom: '3px solid #4a4a4a',
        }}>
          <span>{isMobile ? '🔄 有新版本囉！' : '🔄 系統已經更新到新版本囉！建議先完成手上的作答，再重新整理套用最新內容。'}</span>
          <button
            className="pixel-btn btn-blue"
            style={{ minHeight: '44px', padding: '5px 15px', fontSize: '1rem' }}
            onClick={() => window.location.reload()}
          >
            立即重新整理
          </button>
          <button
            className="pixel-btn btn-ghost"
            style={{ minHeight: '44px', padding: '5px 15px', fontSize: '1rem' }}
            onClick={() => setUpdateDismissed(true)}
          >
            {isMobile ? '稍後' : '稍後再說'}
          </button>
        </div>
      )}
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          {/* 🌟 手機版縮成一行：名字太長時用 … 截斷，按鈕不換行 */}
          <div style={{ padding: isMobile ? '8px 12px' : '10px 20px', backgroundColor: '#4a4a4a', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: isMobile ? '8px' : 0, borderBottom: '4px solid #2c2c2c', position: 'sticky', top: 0, zIndex: 100 }}>
            <span style={{ color: 'white', marginRight: isMobile ? 'auto' : '20px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"tearsfont-1.2", sans-serif' }}>
              {isMobile ? '' : `目前登入：${currentUser.displayName}`}
            </span>
            
            {isTeacher && (
              <button 
                className="pixel-btn btn-blue"
                onClick={() => setCurrentView(currentView === "teacher" ? "studentHome" : "teacher")}
                style={{ marginRight: isMobile ? 0 : '10px', padding: '5px 10px', fontSize: '1rem', flexShrink: 0 }}
              >
                {isMobile ? (currentView === "teacher" ? "學生" : "後台") : `切換至 ${currentView === "teacher" ? "學生主頁" : "教師後台"}`}
              </button>
            )}
            
            <button className="pixel-btn btn-red" onClick={() => setShowLogoutConfirm(true)} style={{ minHeight: '44px', padding: '5px 12px', fontSize: '1rem', flexShrink: 0 }}>登出</button>
          </div>

          {currentView === "studentHome" && (
            <StudentHome 
              user={currentUser} 
              initialTab={homeTab}
              onStartQuiz={(config) => { 
                setQuizConfig(config);
                setHomeTab('quiz');
                setCurrentView("quiz"); 
              }} 
            />
          )}
          
          <Suspense fallback={<PageLoading />}>
            {currentView === "quiz" && (
              <Quiz 
                user={currentUser} 
                config={quizConfig}
                onBack={(tab) => { setHomeTab(tab || 'quiz'); setCurrentView("studentHome"); }} 
              />
            )}
            
            {currentView === "teacher" && isTeacher && (
              <TeacherDashboard user={currentUser} />
            )}
          </Suspense>

          {/* 手機版學生主頁底部有分頁列，版權字樣移到分頁列上方 */}
          {showLogoutConfirm && (
            <PixelDialog
              title="要登出嗎？"
              onClose={() => setShowLogoutConfirm(false)}
              actions={<>
                <button className="pixel-btn btn-blue" style={{ width: '100%', minHeight: '52px', fontSize: '1.2rem' }} onClick={() => setShowLogoutConfirm(false)}>繼續使用</button>
                <button className="pixel-btn btn-ghost" style={{ width: '100%', minHeight: '52px', fontSize: '1.2rem' }} onClick={handleLogout}>登出</button>
              </>}
            >
              登出後要重新用 Google 帳號登入喔！
            </PixelDialog>
          )}

          <div style={{ position: 'fixed', bottom: isMobile && currentView === "studentHome" ? 'calc(72px + env(safe-area-inset-bottom))' : '8px', right: '12px', fontSize: '0.75rem', color: '#9a9a9a', opacity: 0.8, pointerEvents: 'none', userSelect: 'none', zIndex: 1000 }}>
            © 2026 浩宇老師｜桃源國小專用
          </div>
        </div>
      )}
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <MainApp />
  </ErrorBoundary>
);

export default App;