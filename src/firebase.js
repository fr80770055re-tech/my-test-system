import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

// 1. 初始化 Firebase (您的專案真實設定檔)
const firebaseConfig = {
  apiKey: "AIzaSyB7xjxFb3hYNgmMMp0Eb-cqiV8NClq7K_4",
  // 🌟 關鍵修復：這裡已經幫您改回原廠設定，Google 就不會再阻擋了！
  authDomain: "quizprojecttyp.firebaseapp.com", 
  projectId: "quizprojecttyp",
};

// 啟動 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 🌟 2. 關鍵整合：把 auth 和 db 都加上 export 匯出！
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🌟 3. 新增 Google 登入的 Provider
export const provider = new GoogleAuthProvider();