import React, { useState } from 'react';
import Login from './components/Login';
import Quiz from './components/Quiz';
import TeacherDashboard from './components/TeacherDashboard';
import StudentHome from './components/StudentHome';
import { useVersionCheck } from './hooks/useVersionCheck';
import { isEmbeddedInAppBrowser } from './utils/browserDetect';

import './index.css'; 
import '../src/assets/tearsfont-1.2.otf'; 

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
      return (
        <div style={{ padding: '30px', backgroundColor: '#fcebeb', color: '#c0392b', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.8rem', borderBottom: '3px dashed #c0392b', paddingBottom: '10px' }}>⚠️ 畫面崩潰了！抓到兇手：</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ overflowX: 'auto', fontSize: '1rem', backgroundColor: '#fff', padding: '15px', border: '2px solid #c0392b', borderRadius: '10px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
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
  const hasUpdate = useVersionCheck();

  // 🌟 不只擋 LINE：舉凡 FB/IG/微信/Android 系統 WebView 等內嵌瀏覽器都會被 Google 擋下登入，
  // 常見於平板用某些「QR Code 掃描」App 直接開連結的情況，統一在這裡先攔下來並提示切換瀏覽器
  const isInAppBrowser = isEmbeddedInAppBrowser();

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView("studentHome");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("studentHome");
  };

  const TEACHER_EMAIL = "fr80770055re@gmail.com"; 
  const isTeacher = currentUser && currentUser.email === TEACHER_EMAIL;

  if (!currentUser && isInAppBrowser) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2efeb' }}>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '50px', borderRadius: '20px', textAlign: 'center', border: '5px solid #4a4a4a', maxWidth: '90%' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: '20px' }}>⚠️ 請切換瀏覽器</h1>
          <p style={{ fontSize: '1.2rem', color: '#4a4a4a', marginBottom: '20px', lineHeight: '1.5' }}>
            目前這個畫面是被 LINE、Facebook 或某些「掃 QR Code」App 內建的瀏覽器打開的，安全限制下無法登入 Google 帳號。
          </p>
          <div style={{ backgroundColor: '#fdf6e3', padding: '15px', borderRadius: '10px', border: '3px dashed #d6b75a', textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>👉 請依照以下步驟操作：</p>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li>點擊右上角的 <strong>[⋮]</strong> 或 <strong>[⎋]</strong> 圖示</li>
              <li>選擇 <strong style={{ color: '#2980b9' }}>「使用預設瀏覽器開啟」</strong> 或 <strong style={{ color: '#2980b9' }}>「在 Safari 中開啟」</strong></li>
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
      {hasUpdate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap',
          padding: '10px 20px', backgroundColor: '#d6b75a', color: '#4a4a4a',
          fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', fontSize: '1.1rem', fontWeight: 'bold',
          borderBottom: '3px solid #4a4a4a',
        }}>
          <span>🔄 系統已經更新到新版本囉！建議先完成手上的作答，再重新整理套用最新內容。</span>
          <button
            className="pixel-btn btn-blue"
            style={{ padding: '5px 15px', fontSize: '1rem' }}
            onClick={() => window.location.reload()}
          >
            立即重新整理
          </button>
        </div>
      )}
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          <div style={{ padding: '10px 20px', backgroundColor: '#4a4a4a', textAlign: 'right', borderBottom: '4px solid #2c2c2c', position: 'sticky', top: 0, zIndex: 100 }}>
            <span style={{ color: 'white', marginRight: '20px', fontFamily: '"tearsfont-1.2", sans-serif' }}>目前登入：{currentUser.displayName}</span>
            
            {isTeacher && (
              <button 
                className="pixel-btn btn-blue"
                onClick={() => setCurrentView(currentView === "teacher" ? "studentHome" : "teacher")}
                style={{ marginRight: '10px', padding: '5px 10px', fontSize: '1rem' }}
              >
                切換至 {currentView === "teacher" ? "學生主頁" : "教師後台"}
              </button>
            )}
            
            <button className="pixel-btn btn-red" onClick={handleLogout} style={{ padding: '5px 10px', fontSize: '1rem' }}>登出</button>
          </div>

          {currentView === "studentHome" && (
            <StudentHome 
              user={currentUser} 
              onStartQuiz={(config) => { 
                setQuizConfig(config);
                setCurrentView("quiz"); 
              }} 
            />
          )}
          
          {currentView === "quiz" && (
            <Quiz 
              user={currentUser} 
              config={quizConfig}
              onBack={() => setCurrentView("studentHome")} 
            />
          )}
          
          {currentView === "teacher" && isTeacher && (
            <TeacherDashboard user={currentUser} />
          )}

          <div style={{ position: 'fixed', bottom: '8px', right: '12px', fontSize: '0.75rem', color: '#9a9a9a', opacity: 0.8, pointerEvents: 'none', userSelect: 'none', zIndex: 1000 }}>
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