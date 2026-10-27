import React, { useState, useEffect } from 'react';
// 🌟 確保引入了 getRedirectResult 和 signInWithRedirect
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, provider } from '../firebase';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🌟 系統一載入，先檢查是不是剛剛「手機跳轉登入」回來的
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          onLoginSuccess(result.user); // 跳轉成功，直接進入系統！
        } else {
          setIsLoading(false); // 不是跳轉回來的，顯示登入按鈕
        }
      })
      .catch((error) => {
        console.error("跳轉登入失敗:", error);
        setIsLoading(false);
      });
  }, [onLoginSuccess]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      // 🌟 所有裝置一律先用「彈出視窗」登入。
      // 以前手機/平板走「本頁跳轉」(signInWithRedirect)，但新版 Android Chrome 會封鎖跨網域儲存空間，
      // 網站讀不到 authDomain（quizprojecttyp.firebaseapp.com）存的登入結果，
      // 造成「選完帳號又跳回登入畫面」。彈出視窗登入不受這個限制影響。
      // 注意：signInWithPopup 前面不能有其他 await，否則瀏覽器會認為不是點擊觸發而擋掉視窗。
      const result = await signInWithPopup(auth, provider);
      onLoginSuccess(result.user);
    } catch (error) {
      // 學生自己關掉選帳號視窗，回到登入按鈕即可，不用跳錯誤
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      // 瀏覽器擋下彈出視窗時，最後手段才改用「本頁跳轉」登入
      if (error.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("跳轉登入失敗:", redirectError);
        }
      }
      console.error("登入失敗:", error);
      alert("登入中斷，請確認網路或再試一次。");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div className="pixel-card" style={styles.card}>
          <h2 style={{ color: '#4a4a4a', fontSize: '1.8rem' }}>⏳ 系統登入中...</h2>
          <p style={{ color: '#7f8c8d', marginTop: '10px' }}>請稍候，正在為您連接 Google</p>
        </div>
        <div style={styles.credit}>© 2026 浩宇老師｜桃源國小專用</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div className="pixel-card" style={styles.card}>
        <h1 style={{ fontSize: '2.5rem', color: '#4a4a4a', marginBottom: '20px' }}>五年忠班隨手測</h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', marginBottom: '30px' }}>請使用 Google 帳號登入系統</p>

        <button className="pixel-btn btn-blue" style={styles.loginBtn} onClick={handleGoogleLogin}>
          🔑 Google 一鍵登入
        </button>

        <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#fdf6e3', borderRadius: '10px', border: '3px dashed #d6b75a', textAlign: 'left' }}>
          <p style={{ color: '#c0392b', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            ⚠️ 手機／平板使用重要提醒：
          </p>
          <p style={{ color: '#4a4a4a', fontSize: '0.95rem', margin: '0' }}>
            若您是從 LINE、FB 或「掃 QR Code」App 點開這個畫面，請務必點擊右上角 <strong>[⋮]</strong> 或 <strong>[⎋]</strong>，選擇 <strong>「以預設瀏覽器開啟」</strong>（Safari 或 Chrome），才能順利登入喔！建議直接用內建「相機」App 掃 QR Code 最不容易出問題。
          </p>
        </div>
      </div>
      <div style={styles.credit}>© 2026 浩宇老師｜桃源國小專用</div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f2efeb', width: '100%' },
  card: { padding: '40px', textAlign: 'center', maxWidth: '400px', width: '90%' },
  loginBtn: { padding: '15px 30px', fontSize: '1.5rem', width: '100%' },
  credit: { position: 'fixed', bottom: '8px', right: '12px', fontSize: '0.75rem', color: '#9a9a9a', opacity: 0.8, pointerEvents: 'none', userSelect: 'none' }
};

export default Login;