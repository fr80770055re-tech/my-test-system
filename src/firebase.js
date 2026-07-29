import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// 1. 初始化 Firebase (請替換為您專案的真實設定檔)
const firebaseConfig = {
  apiKey: "AIzaSyB7xjxFb3hYNgmMMp0Eb-cqiV8NClq7K_4",
  authDomain: "quizprojecttyp.firebaseapp.com",
  projectId: "quizprojecttyp",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 2. 登入功能實作
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // 檢查資料庫中是否已有此用戶，若無則建立初始資料
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: "student", // 預設為學生，老師帳號可由後台手動修改
        coins: 0,        // 初始金幣
        avatar: "basic_bear", // 預設紙娃娃造型
        createdAt: new Date().toISOString()
      });
    }
    return user;
  } catch (error) {
    console.error("登入失敗:", error);
    throw error;
  }
};