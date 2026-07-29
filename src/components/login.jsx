import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const user = await loginWithGoogle();
      console.log("登入成功！", user);
      
      // 呼叫上層元件傳遞下來的函式，通知 App 已經登入成功
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (error) {
      setErrorMsg("登入失敗，請確認您的網路連線或重試。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>歡迎來到測驗系統</h1>
      <p style={styles.subtitle}>請使用您的學校 Google 帳號登入</p>
      
      {errorMsg && <p style={styles.error}>{errorMsg}</p>}
      
      <button 
        onClick={handleLogin} 
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? "登入中..." : "📚 使用 Google 教育帳號登入"}
      </button>
    </div>
  );
};

// 簡單的高對比/大字體行內樣式 (MVP 階段適用)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#faf8f5',
    fontFamily: '"Microsoft JhengHei", sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#34495e',
    marginBottom: '30px',
  },
  button: {
    padding: '15px 30px',
    fontSize: '1.5rem',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  error: {
    color: '#e74c3c',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  }
};

export default Login;