import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import moneyIconImg from '../assets/money.png';

const Quiz = ({ user, userData, onBack }) => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'reviewMistakes', 'result'
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // 錯題與數據追蹤
  const [mistakes, setMistakes] = useState([]);
  const [isFirstRound, setIsFirstRound] = useState(true);
  const [firstTryScore, setFirstTryScore] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startGame = async () => {
    setGameState('playing');
    setIsSubmitting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "questions"));
      let allQuestions = [];
      querySnapshot.forEach(doc => allQuestions.push({ id: doc.id, ...doc.data() }));
      
      // 隨機抽 10 題出來考 (可依需求調整)
      allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
      
      setQuestions(allQuestions);
      setCurrentQIndex(0);
      setMistakes([]);
      setIsFirstRound(true);
      setFirstTryScore(0);
    } catch (error) {
      console.error("讀取題目失敗", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async (selectedOption) => {
    const currentQ = questions[currentQIndex];
    const isCorrect = (selectedOption === currentQ.correct_answer);

    // 🌟 第一輪作答：上傳學習數據供老師分析
    if (isFirstRound) {
      if (isCorrect) setFirstTryScore(prev => prev + 1);
      try {
        await addDoc(collection(db, "quiz_logs"), {
          userId: user.uid,
          userName: userData.name,
          questionId: currentQ.id,
          questionContent: currentQ.content,
          isCorrectFirstTry: isCorrect,
          timestamp: new Date().toISOString()
        });
      } catch (error) { console.error("數據上傳失敗", error); }
    }

    // 紀錄錯題
    const updatedMistakes = !isCorrect ? [...mistakes, currentQ] : mistakes;
    if (!isCorrect) setMistakes(updatedMistakes);

    // 換題邏輯
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // 🌟 進入精熟學習判定：有錯就進複習，沒錯就發獎勵
      if (updatedMistakes.length > 0) {
        setGameState('reviewMistakes');
      } else {
        finishGame();
      }
    }
  };

  const handleRetryMistakes = () => {
    // 把錯題變成新的考卷，再次測驗
    setQuestions(mistakes.sort(() => Math.random() - 0.5));
    setMistakes([]);
    setCurrentQIndex(0);
    setIsFirstRound(false); // 進入補考模式，不計入首答數據
    setGameState('playing');
  };

  const finishGame = async () => {
    setGameState('result');
    setIsSubmitting(true);
    try {
      // 🌟 取消部份給分，只要最終通過精熟補考，一律發放 10 金幣獎勵
      const newCoins = (userData.coins || 0) + 10;
      await updateDoc(doc(db, "users", user.uid), { coins: newCoins });
      userData.coins = newCoins;
    } catch (error) {
      console.error("發放金幣失敗", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={styles.container}>
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>📝 學科綜合測驗</h2>
          <p style={styles.desc}>本測驗需全數答對才能獲得獎勵！答錯的題目系統會提供詳解，幫助你重新挑戰直到完全學會。</p>
          <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={startGame} disabled={isSubmitting}>
            {isSubmitting ? '⏳ 載入考卷中...' : '⚔️ 開始測驗 (獎勵 10 金幣)'}
          </button>
          <button className="pixel-btn btn-gray" style={{...styles.actionBtn, marginTop: '20px'}} onClick={onBack}>⬅ 返回主頁</button>
        </div>
      )}

      {gameState === 'playing' && questions.length > 0 && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={{color: '#7f8c8d', marginBottom: '15px'}}>
            {isFirstRound ? '🎯 第一次作答' : '💪 錯題重測'} ({currentQIndex + 1}/{questions.length})
          </h3>
          
          <div style={styles.qBox}>
            {questions[currentQIndex].imageUrl && (
              <img src={questions[currentQIndex].imageUrl} alt="題目附圖" style={styles.qImage} />
            )}
            <div style={styles.qText}>{questions[currentQIndex].content}</div>
          </div>

          <div style={styles.optionsGrid}>
            {['A', 'B', 'C', 'D'].map(opt => (
              questions[currentQIndex].options[opt] && (
                <button key={opt} className="pixel-btn btn-blue" style={styles.optBtn} onClick={() => handleAnswer(opt)}>
                  <span style={{color: '#d6b75a', marginRight: '10px'}}>{opt}.</span>
                  {questions[currentQIndex].options[opt]}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* 🌟 錯題詳解複習畫面 */}
      {gameState === 'reviewMistakes' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={{...styles.title, color: '#c0392b'}}>😵 觀念釐清時間！</h2>
          <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>請仔細閱讀以下詳解，確認理解後再挑戰一次錯題！</p>
          
          <div style={styles.mistakeList}>
            {mistakes.map((m, idx) => (
              <div key={idx} style={styles.mistakeItem}>
                <div style={{fontWeight: 'bold', fontSize: '1.3rem', color: '#2c3e50'}}>{m.content || '(圖片題)'}</div>
                <div style={{marginTop: '10px', color: '#4a4a4a'}}>正確答案是：<span style={{color: '#8ca279', fontWeight: 'bold'}}>{m.options[m.correct_answer]}</span></div>
                
                {/* 顯示老師留下的詳解 */}
                {m.explanation && (
                  <div style={styles.explanationBox}>
                    💡 <strong>老師提示：</strong>{m.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button className="pixel-btn btn-red" style={styles.actionBtn} onClick={handleRetryMistakes}>
            ⚔️ 我懂了，再次挑戰！
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>🎉 完美過關！</h2>
          <div className="pixel-box" style={{backgroundColor: '#e8e8e8', padding: '30px', margin: '20px 0'}}>
            首輪答對數：<span style={{fontSize: '2rem', fontWeight: 'bold', color: '#8ca279'}}>{firstTryScore}</span> / 10 <br/><br/>
            <div style={{color: '#d6b75a', fontSize: '1.5rem', fontWeight: 'bold'}}>
              你克服了所有難題！獲得 <img src={moneyIconImg} alt="money" style={{height: '30px', verticalAlign: 'middle'}} /> 10 金幣！
            </div>
          </div>
          <button className="pixel-btn btn-gray" style={styles.actionBtn} onClick={onBack}>回首頁</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' },
  card: { padding: '30px', textAlign: 'center', backgroundColor: '#f2efeb' },
  title: { fontSize: '2.2rem', color: '#4a4a4a', borderBottom: '4px dashed #4a4a4a', paddingBottom: '15px', marginBottom: '20px' },
  desc: { fontSize: '1.3rem', color: '#4a4a4a', marginBottom: '30px', lineHeight: '1.5' },
  actionBtn: { padding: '15px', fontSize: '1.5rem', width: '100%' },
  
  qBox: { padding: '30px', backgroundColor: '#fff', border: '6px solid #4a4a4a', marginBottom: '20px', textAlign: 'left' },
  qImage: { maxWidth: '100%', maxHeight: '300px', marginBottom: '15px', border: '2px dashed #ccc' },
  qText: { fontSize: '1.8rem', color: '#2c3e50', fontWeight: 'bold', lineHeight: '1.4' },
  
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  optBtn: { padding: '20px', fontSize: '1.5rem', textAlign: 'left', lineHeight: '1.3' },

  mistakeList: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' },
  mistakeItem: { padding: '20px', backgroundColor: '#fff', border: '4px dashed #4a4a4a' },
  explanationBox: { marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderLeft: '6px solid #ffeeba', fontSize: '1.2rem' }
};

export default Quiz;