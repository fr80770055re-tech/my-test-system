import React, { useState } from 'react';
import Login from './components/Login';
import Quiz from './components/Quiz';
import TeacherDashboard from './components/TeacherDashboard';
import StudentHome from './components/StudentHome'; // 匯入剛剛寫好的學生主頁

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // 紀錄目前畫面狀態："studentHome" (主頁), "quiz" (測驗中), "teacher" (教師後台)
  const [currentView, setCurrentView] = useState("studentHome"); 

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView("studentHome"); // 登入後預設進入學生主頁
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("studentHome");
  };

  return (
    <div style={{ backgroundColor: '#faf8f5', minHeight: '100vh' }}>
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          {/* 開發測試用的頂部導覽列 (真實上線時可對學生隱藏) */}
          <div style={{ padding: '10px 20px', backgroundColor: '#2c3e50', textAlign: 'right' }}>
            <span style={{ color: 'white', marginRight: '20px' }}>目前登入：{currentUser.displayName}</span>
            <button 
              onClick={() => setCurrentView(currentView === "teacher" ? "studentHome" : "teacher")}
              style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer' }}
            >
              切換至 {currentView === "teacher" ? "學生主頁" : "教師後台"}
            </button>
            <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>登出</button>
          </div>

          {/* 根據狀態顯示不同畫面 */}
          {currentView === "studentHome" && (
            <StudentHome 
              user={currentUser} 
              onStartQuiz={() => setCurrentView("quiz")} 
            />
          )}
          
          {currentView === "quiz" && (
            <Quiz 
              user={currentUser} 
              onLogout={() => setCurrentView("studentHome")} // 交卷後回到主頁
            />
          )}
          
          {currentView === "teacher" && (
            <TeacherDashboard user={currentUser} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;