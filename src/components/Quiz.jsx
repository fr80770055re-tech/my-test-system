import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const Quiz = ({ user, onLogout }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState({ score: 0, coins: 0 });

  // 1. 元件載入時，從 Firebase 抓取題庫
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "questions"));
        const fetchedQuestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // 如果沒有題目，給一個防呆提示
        if (fetchedQuestions.length === 0) {
          alert("目前還沒有題目喔！請先請老師匯入題庫。");
        } else {
          setQuestions(fetchedQuestions);
        }
      } catch (error) {
        console.error("抓取題目失敗:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (optionKey) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: optionKey
    });
  };

  // 2. 處理交卷與計分邏輯
  const handleSubmit = async () => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    let confirmMessage = "確定要交卷了嗎？交卷後就不能修改囉！";
    if (unansweredCount > 0) {
      confirmMessage = `您還有 ${unansweredCount} 題沒寫完！確定要提早交卷嗎？`;
    }

    if (!window.confirm(confirmMessage)) return;

    setIsLoading(true);
    let totalScore = 0;

    // 計算分數與部分給分
    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (studentAnswer === q.correct_answer) {
        totalScore += q.points; // 全對得全分
      } else if (q.partial_scores && q.partial_scores[studentAnswer]) {
        totalScore += q.partial_scores[studentAnswer]; // 獲得部分給分
      }
    });

    // 設定獲得的金幣 (MVP 先設定 1分 = 1金幣)
    const coinsEarned = totalScore;

    try {
      // 寫入成績紀錄 (records)
      await addDoc(collection(db, "records"), {
        student_id: user.uid,
        student_name: user.displayName || user.name,
        answers: answers,
        total_score: totalScore,
        coins_earned: coinsEarned,
        submitted_at: new Date().toISOString()
      });

      // 更新學生的金幣餘額 (users)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        coins: increment(coinsEarned)
      });

      setResult({ score: totalScore, coins: coinsEarned });
      setIsSubmitted(true);
    } catch (error) {
      console.error("交卷失敗:", error);
      alert("交卷失敗，請檢查網路連線。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={styles.container}><h2 style={styles.title}>⏳ 載入中...</h2></div>;
  }

  if (questions.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📭 目前沒有任何測驗</h2>
        <button style={styles.submitBtn} onClick={onLogout}>登出</button>
      </div>
    );
  }

  // 3. 交卷後的結算畫面
  if (isSubmitted) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🎉 測驗完成！</h2>
        <div style={styles.resultCard}>
          <p style={styles.text}>恭喜 {user.displayName || user.name} 順利完成測驗！</p>
          <h1 style={styles.scoreText}>總分：{result.score} 分</h1>
          <p style={styles.coinText}>💰 獲得金幣：{result.coins} 枚</p>
        </div>
        <button style={styles.submitBtn} onClick={onLogout}>登出並回到首頁</button>
      </div>
    );
  }

  // 測驗進行中的畫面
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>{currentQuestion.subject}</span>
        <span style={styles.progress}>
          第 {currentIndex + 1} / {questions.length} 題
        </span>
      </div>

      <div style={styles.questionCard}>
        <h3 style={styles.questionText}>
          {currentIndex + 1}. {currentQuestion.content}
        </h3>
        {/* 提示小功能 */}
        {currentQuestion.hint && (
          <p style={styles.hintText}>💡 提示：{currentQuestion.hint}</p>
        )}
      </div>

      <div style={styles.optionsContainer}>
        {Object.entries(currentQuestion.options)
          .filter(([key, value]) => value !== "") // 過濾掉空白選項(如是非題的C和D)
          .map(([key, value]) => {
          const isSelected = answers[currentQuestion.id] === key;
          return (
            <button
              key={key}
              style={{
                ...styles.optionBtn,
                backgroundColor: isSelected ? '#e3f2fd' : '#ffffff',
                borderColor: isSelected ? '#2196f3' : '#e0e0e0',
                borderWidth: isSelected ? '3px' : '1px',
              }}
              onClick={() => handleSelect(key)}
            >
              <span style={styles.optionKey}>{key}</span>
              <span style={styles.optionValue}>{value}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.footer}>
        <button 
          style={styles.navBtn} 
          onClick={() => setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ◀ 上一題
        </button>

        {currentIndex === questions.length - 1 ? (
          <button style={styles.submitBtn} onClick={handleSubmit}>
            交卷 📤
          </button>
        ) : (
          <button 
            style={styles.navBtn} 
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            下一題 ▶
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  badge: { backgroundColor: '#ffe082', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', color: '#5d4037' },
  progress: { fontSize: '1.2rem', color: '#7f8c8d', fontWeight: 'bold' },
  questionCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' },
  questionText: { fontSize: '1.8rem', color: '#2c3e50', margin: 0, lineHeight: '1.5' },
  hintText: { fontSize: '1.1rem', color: '#e67e22', marginTop: '15px', backgroundColor: '#fdf2e9', padding: '10px', borderRadius: '8px' },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' },
  optionBtn: { display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '10px', borderStyle: 'solid', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' },
  optionKey: { fontSize: '1.5rem', fontWeight: 'bold', color: '#34495e', width: '40px' },
  optionValue: { fontSize: '1.5rem', color: '#2c3e50' },
  footer: { display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderTop: '2px solid #ecf0f1' },
  navBtn: { padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#ecf0f1', color: '#34495e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  submitBtn: { padding: '15px 40px', fontSize: '1.3rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)' },
  title: { fontSize: '2.5rem', color: '#2c3e50', textAlign: 'center' },
  text: { fontSize: '1.5rem', color: '#34495e', textAlign: 'center' },
  resultCard: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '30px' },
  scoreText: { fontSize: '3rem', color: '#e74c3c', margin: '20px 0' },
  coinText: { fontSize: '1.8rem', color: '#f39c12', fontWeight: 'bold' }
};

export default Quiz;