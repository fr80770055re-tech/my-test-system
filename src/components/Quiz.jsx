import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import moneyIconImg from '../assets/money.png';

// 🌟 獨立的洗牌小幫手：負責把選項打亂，並重新標定正確答案的位置
const shuffleQuestion = (q) => {
  // 1. 先記住「正確答案的文字」是什麼
  const correctText = q.options[q.correct_answer];

  // 2. 把所有有內容的選項抓出來過濾掉空白的，並打亂順序
  const validOptions = Object.values(q.options).filter(opt => opt && opt.trim() !== '');
  const shuffledOptions = validOptions.sort(() => Math.random() - 0.5);

  // 3. 重新分配給 A, B, C, D
  const newOptions = {};
  let newCorrectAnswer = 'A'; // 預設值
  const labels = ['A', 'B', 'C', 'D'];

  shuffledOptions.forEach((text, idx) => {
    const label = labels[idx];
    newOptions[label] = text;
    // 如果這個文字跟原本的正確文字一樣，那這個位置就是新的正確答案！
    if (text === correctText) {
      newCorrectAnswer = label;
    }
  });

  return { ...q, options: newOptions, correct_answer: newCorrectAnswer };
};

const Quiz = ({ user, userData, onBack }) => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

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

      // 🌟 抽出題目後，不僅題目順序打亂，連每個選項都呼叫 shuffleQuestion 洗牌！
      allQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(shuffleQuestion);

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

    const updatedMistakes = !isCorrect ? [...mistakes, currentQ] : mistakes;
    if (!isCorrect) setMistakes(updatedMistakes);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      if (updatedMistakes.length > 0) {
        setGameState('reviewMistakes');
      } else {
        finishGame();
      }
    }
  };

  const handleRetryMistakes = () => {
    // 🌟 進入補考時，不僅錯題順序打亂，錯題的選項也要再次洗牌！
    const newQuestions = mistakes.map(shuffleQuestion).sort(() => Math.random() - 0.5);

    setQuestions(newQuestions);
    setMistakes([]);
    setCurrentQIndex(0);
    setIsFirstRound(false);
    setGameState('playing');
  };

  const finishGame = async () => {
    setGameState('result');
    setIsSubmitting(true);
    try {
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
          <p style={styles.desc}>本測驗需全數答對才能獲得獎勵！答錯的題目系統會提供提示，幫助你重新思考並挑戰直到完全學會。</p>
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

      {gameState === 'reviewMistakes' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={{...styles.title, color: '#c0392b'}}>😵 觀念釐清時間！</h2>
          <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>請根據下方的提示再仔細想一想，確認後準備再次挑戰！</p>

          <div style={styles.mistakeList}>
            {mistakes.map((m, idx) => (
              <div key={idx} style={styles.mistakeItem}>
                <div style={{fontWeight: 'bold', fontSize: '1.3rem', color: '#2c3e50'}}>{m.content || '(圖片題)'}</div>

                {m.explanation ? (
                  <div style={styles.explanationBox}>
                    💡 <strong>老師提示：</strong>{m.explanation}
                  </div>
                ) : (
                  <div style={styles.explanationBox}>
                    💡 <strong>提示：</strong>請再仔細檢查一下題目，或者回想一下上課的內容喔！
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="pixel-btn btn-red" style={styles.actionBtn} onClick={handleRetryMistakes}>
            ⚔️ 我準備好了，再次挑戰！
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
  explanationBox: { marginTop: '15px', padding: '15px', backgroundColor: '#e8f4f8', color: '#2c3e50', borderLeft: '6px solid #6e85b7', fontSize: '1.2rem' }
};

export default Quiz;
