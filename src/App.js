import React, { useState } from 'react';
import Login from './components/Login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  return (
    <div>
      {/* 判斷：如果沒有使用者資料，顯示登入畫面；如果有，進入測驗系統主畫面 */}
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>你好，{currentUser.displayName || currentUser.name}！</h2>
          <p>準備好開始今天的測驗了嗎？</p>
          {/* 未來這裡可以替換成您的「學生主頁」或「教師後台」元件 */}
        </div>
      )}
    </div>
  );
}

export default App;