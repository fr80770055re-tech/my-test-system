import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
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

const Quiz = ({ user, config, onBack }) => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [mistakes, setMistakes] = useState([]);
  const [isFirstRound, setIsFirstRound] = useState(true);
  const [firstTryScore, setFirstTryScore] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [finalScore, setFinalScore] = useState(0); // 🌟 最終（第二次機會結束後）答對題數
  const [finalMistakes, setFinalMistakes] = useState([]); // 🌟 兩次機會後仍然答錯的題目
  const [coinsEarned, setCoinsEarned] = useState(0); // 🌟 這次測驗實際獲得的金幣（依最終答對比例計算）

  // 🌟 學生選擇的科目/單元/模式（來自 StudentHome）；userData 過去沒有實際被傳入，改為在這裡自己讀取最新資料
  const subject = config?.subject || '數學';
  const unit = config?.unit || 'ALL';
  const mode = config?.mode || 'formal';
  const settings = config?.settings || { cooldownMinutes: 60, coinMultiplier: 1, practiceReward: 0 };
  const reward = mode === 'practice' ? (settings.practiceReward || 0) : Math.round(10 * (settings.coinMultiplier || 1));

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      } catch (error) {
        console.error("讀取學生資料失敗", error);
      }
    };
    if (user?.uid) loadProfile();
  }, [user]);

  const startGame = async () => {
    setGameState('playing');
    setIsSubmitting(true);
    try {
      // 🌟 依科目抓題，再依選擇的單元篩選（'ALL' 代表全部單元混合出題）
      const q = query(collection(db, "questions"), where("subject", "==", subject));
      const querySnapshot = await getDocs(q);
      let allQuestions = [];
      querySnapshot.forEach(docSnap => allQuestions.push({ id: docSnap.id, ...docSnap.data() }));

      if (unit !== 'ALL') {
        allQuestions = allQuestions.filter(item => (item.unit || '未分類') === unit);
      }

      if (allQuestions.length === 0) {
        alert('這個單元目前還沒有題目喔，請先請老師新增題目，或改選其他單元！');
        setGameState('menu');
        setIsSubmitting(false);
        return;
      }

      // 🌟 抽出題目後，不僅題目順序打亂，連每個選項都呼叫 shuffleQuestion 洗牌！
      allQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(shuffleQuestion);

      setQuestions(allQuestions);
      setTotalQuestions(allQuestions.length); // 🌟 記住這輪測驗的總題數，之後補考輪次不會覆蓋這個數字
      setCurrentQIndex(0);
      setMistakes([]);
      setIsFirstRound(true);
      setFirstTryScore(0);
      setFinalScore(0);
      setFinalMistakes([]);
      setCoinsEarned(0);
    } catch (error) {
      console.error("讀取題目失敗", error);
      setGameState('menu');
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
          userName: profile?.name || user.displayName || '未知學生',
          questionId: currentQ.id,
          questionContent: currentQ.content,
          subject: currentQ.subject || subject,
          unit: currentQ.unit || unit,
          isCorrectFirstTry: isCorrect,
          timestamp: new Date().toISOString()
        });
      } catch (error) { console.error("數據上傳失敗", error); }
    }

    const updatedMistakes = !isCorrect ? [...mistakes, currentQ] : mistakes;
    if (!isCorrect) setMistakes(updatedMistakes);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else if (isFirstRound) {
      // 🌟 第一次作答結束：全對就直接結算，有錯才進入複習畫面準備最後一次機會
      if (updatedMistakes.length > 0) {
        setGameState('reviewMistakes');
      } else {
        finalizeSession([]);
      }
    } else {
      // 🌟 第二次（最後一次）機會結束，不論這輪答對答錯多少題，都直接結算成績，不再有第三次機會
      finalizeSession(updatedMistakes);
    }
  };

  const handleRetryMistakes = () => {
    // 🌟 進入最後一次機會時，不僅錯題順序打亂，錯題的選項也要再次洗牌！
    const newQuestions = mistakes.map(shuffleQuestion).sort(() => Math.random() - 0.5);

    setQuestions(newQuestions);
    setMistakes([]);
    setCurrentQIndex(0);
    setIsFirstRound(false);
    setGameState('playing');
  };

  // 🌟 測驗真正結束時呼叫（第一次全對，或第二次/最後一次機會結束）：計算最終分數、依比例發獎勵、並記錄這次考試的場次數據供老師後台分析
  const finalizeSession = async (finalWrongList) => {
    setGameState('result');
    setIsSubmitting(true);

    const finalCorrect = totalQuestions - finalWrongList.length;
    const ratio = totalQuestions > 0 ? finalCorrect / totalQuestions : 0;
    const coinsEarned = Math.max(0, Math.round(reward * ratio));

    setFinalScore(finalCorrect);
    setFinalMistakes(finalWrongList);
    setCoinsEarned(coinsEarned);

    try {
      const newCoins = (profile?.coins || 0) + coinsEarned;
      const updates = { coins: newCoins };
      if (mode === 'formal') {
        updates.last_quiz_time = new Date().toISOString(); // 🌟 只有正式測驗才會觸發冷卻時間
      }
      await updateDoc(doc(db, "users", user.uid), updates);
      setProfile(prev => (prev ? { ...prev, coins: newCoins } : prev));

      // 🌟 寫入場次紀錄：讓老師後台可以看到每次考試的「初次分數」與「最終分數」
      await addDoc(collection(db, "quiz_sessions"), {
        userId: user.uid,
        userName: profile?.name || user.displayName || '未知學生',
        subject, unit, mode,
        totalQuestions,
        firstTryScore,
        finalScore: finalCorrect,
        coinsEarned,
        wrongQuestions: finalWrongList.map(q => ({ id: q.id, content: q.content })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("測驗結算失敗", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={styles.container}>
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>📝 {subject}測驗 {unit !== 'ALL' && `- ${unit}`}</h2>
          <p style={styles.desc}>本測驗總共有兩次作答機會：答錯的題目在複習提示後可以重測一次，兩次機會結束就會直接結算成績，答對越多獲得的金幣就越多，請把握機會認真作答！</p>
          <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={startGame} disabled={isSubmitting}>
            {isSubmitting ? '⏳ 載入考卷中...' : `⚔️ 開始測驗 ${reward > 0 ? `(最高可得 ${reward} 金幣)` : ''}`}
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
          <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>請根據下方的提示再仔細想一想！⚠️ 這是最後一次機會，答完後不論對錯都會直接結算成績囉！</p>

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
            ⚔️ 我準備好了，最後一次挑戰！
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>{finalScore === totalQuestions ? '🎉 完美過關！' : '📊 測驗結束！'}</h2>
          <div className="pixel-box" style={{backgroundColor: '#e8e8e8', padding: '30px', margin: '20px 0'}}>
            <div style={{display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '15px'}}>
              <div>初次測驗：<span style={{fontSize: '2rem', fontWeight: 'bold', color: '#6e85b7'}}>{firstTryScore}</span> / {totalQuestions}</div>
              <div>最終測驗：<span style={{fontSize: '2rem', fontWeight: 'bold', color: '#8ca279'}}>{finalScore}</span> / {totalQuestions}</div>
            </div>
            {coinsEarned > 0 ? (
              <div style={{color: '#d6b75a', fontSize: '1.5rem', fontWeight: 'bold'}}>
                獲得 <img src={moneyIconImg} alt="money" style={{height: '30px', verticalAlign: 'middle'}} /> {coinsEarned} 金幣！
              </div>
            ) : (
              <div style={{color: '#8ca279', fontSize: '1.3rem', fontWeight: 'bold'}}>
                辛苦了，再接再厲！
              </div>
            )}
          </div>

          {/* 🌟 兩次機會後仍答錯的題目，繼續給提示但不顯示答案，讓學生知道還要加強哪裡 */}
          {finalMistakes.length > 0 && (
            <div style={{textAlign: 'left', marginBottom: '20px'}}>
              <h3 style={{color: '#c0392b', fontSize: '1.3rem', marginBottom: '10px'}}>💪 這幾題還要再加強：</h3>
              <div style={styles.mistakeList}>
                {finalMistakes.map((m, idx) => (
                  <div key={idx} style={styles.mistakeItem}>
                    <div style={{fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50'}}>{m.content || '(圖片題)'}</div>
                    {m.explanation ? (
                      <div style={styles.explanationBox}>💡 <strong>老師提示：</strong>{m.explanation}</div>
                    ) : (
                      <div style={styles.explanationBox}>💡 <strong>提示：</strong>請再回去複習一下這個概念喔！</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
