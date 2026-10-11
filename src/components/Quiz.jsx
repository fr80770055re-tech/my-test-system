import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where, increment } from 'firebase/firestore';
import { db } from '../firebase';
import moneyIconImg from '../assets/money.png';
import PixelDialog from './PixelDialog';

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

  // 🌟 兩段式作答：先點選（按鈕壓下），再按「確定」送出，避免手機誤觸直接被記成錯題
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'，送出後蓋一下印章再換題
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [shownCoins, setShownCoins] = useState(0); // 結算頁金幣跳數動畫用
  const [coinSave, setCoinSave] = useState('idle'); // 'saving' | 'saved' | 'error'：金幣真的存進去才慶祝
  const [menuError, setMenuError] = useState(null); // 選單頁的提示（沒題目、讀取失敗），取代原生 alert
  const feedbackTimer = useRef(null);
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

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
    setMenuError(null);
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
        setMenuError('📭 這個單元還沒有題目喔！請回主頁改選其他單元，或請老師新增題目。');
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
      setGameState('playing');
    } catch (error) {
      console.error("讀取題目失敗", error);
      setMenuError('😅 考卷載入失敗了，請檢查網路後再按一次「出發」。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async (selectedOption) => {
    const currentQ = questions[currentQIndex];
    const isCorrect = (selectedOption === currentQ.correct_answer);
    // 直接算出最新的初次分數傳給結算，避免拿到 state 更新前的舊值（最後一題答對會少算 1 分）
    const latestFirstTry = firstTryScore + (isFirstRound && isCorrect ? 1 : 0);

    if (isFirstRound) {
      if (isCorrect) setFirstTryScore(latestFirstTry);
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
        finalizeSession([], latestFirstTry);
      }
    } else {
      // 🌟 第二次（最後一次）機會結束，不論這輪答對答錯多少題，都直接結算成績，不再有第三次機會
      finalizeSession(updatedMistakes, latestFirstTry);
    }
  };

  const confirmAnswer = () => {
    if (!selectedOpt || feedback) return;
    const opt = selectedOpt;
    setFeedback(opt === questions[currentQIndex].correct_answer ? 'correct' : 'wrong');
    feedbackTimer.current = setTimeout(async () => {
      await handleAnswer(opt);
      setSelectedOpt(null);
      setFeedback(null);
    }, 900);
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

  // 🌟 把金幣存進資料庫：用 increment 只「加上」這次賺的，不會用舊餘額覆蓋掉別處的變動（例如另一台裝置剛買了東西）
  const saveCoins = async (earned) => {
    setCoinSave('saving');
    try {
      const updates = { coins: increment(earned) };
      if (mode === 'formal') {
        updates.last_quiz_time = new Date().toISOString(); // 🌟 只有正式測驗才會觸發冷卻時間
      }
      await updateDoc(doc(db, "users", user.uid), updates);
      setCoinSave('saved');
    } catch (error) {
      console.error("金幣存檔失敗", error);
      setCoinSave('error');
    }
  };

  // 🌟 測驗真正結束時呼叫（第一次全對，或第二次/最後一次機會結束）：計算最終分數、依比例發獎勵、並記錄這次考試的場次數據供老師後台分析
  const finalizeSession = async (finalWrongList, finalFirstTry) => {
    setGameState('result');
    setIsSubmitting(true);

    const finalCorrect = totalQuestions - finalWrongList.length;
    const ratio = totalQuestions > 0 ? finalCorrect / totalQuestions : 0;
    const earned = Math.max(0, Math.round(reward * ratio));

    setFinalScore(finalCorrect);
    setFinalMistakes(finalWrongList);
    setCoinsEarned(earned);

    await saveCoins(earned);

    // 🌟 寫入場次紀錄：讓老師後台可以看到每次考試的「初次分數」與「最終分數」（失敗不影響學生畫面）
    try {
      await addDoc(collection(db, "quiz_sessions"), {
        userId: user.uid,
        userName: profile?.name || user.displayName || '未知學生',
        subject, unit, mode,
        totalQuestions,
        firstTryScore: finalFirstTry,
        finalScore: finalCorrect,
        coinsEarned: earned,
        wrongQuestions: finalWrongList.map(q => ({ id: q.id, content: q.content })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("場次紀錄寫入失敗", error);
    }
    setIsSubmitting(false);
  };

  // 🌟 結算頁金幣從 0 跳到實際數字；系統設定「減少動態效果」時直接顯示
  useEffect(() => {
    if (coinSave !== 'saved' || coinsEarned <= 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = reduceMotion ? 1 : Math.min(1, (now - start) / 700);
      setShownCoins(Math.round(coinsEarned * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [coinSave, coinsEarned]);

  const currentQ = questions[currentQIndex];

  return (
    <div style={styles.container}>
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>📝 {subject}測驗{unit !== 'ALL' && ` - ${unit}`}</h2>
          <p style={styles.lead}>準備好了嗎？</p>
          <ul style={styles.ruleList}>
            <li>🎯 每題選好答案，再按「確定」</li>
            <li>💪 答錯的題目，看完提示可以再挑戰一次</li>
            <li>💰 答對越多，金幣越多！</li>
          </ul>
          {menuError && <div className="pixel-box" role="alert" style={styles.inlineNotice}>{menuError}</div>}
          <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={startGame} disabled={isSubmitting}>
            {isSubmitting ? '⏳ 載入考卷中...' : `⚔️ 出發！${reward > 0 ? `（最多 ${reward} 金幣）` : ''}`}
          </button>
          <button className="pixel-btn btn-ghost" style={{...styles.actionBtn, ...styles.secondaryBtn}} onClick={() => onBack()}>⬅ 返回主頁</button>
        </div>
      )}

      {gameState === 'playing' && currentQ && (
        <div className="pixel-card" style={styles.card}>
          <div style={styles.playHeader}>
            <span style={styles.roundLabel}>{isFirstRound ? '🎯 第一次作答' : '💪 錯題重測'}</span>
            <button className="pixel-btn btn-ghost" style={styles.leaveBtn} onClick={() => setShowLeaveConfirm(true)} disabled={!!feedback}>
              ✕ 離開
            </button>
          </div>

          {/* 像素進度格：做完的題目塗滿 */}
          <div style={styles.progressRow} role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentQIndex + 1} aria-label={`第 ${currentQIndex + 1} 題，共 ${questions.length} 題`}>
            {questions.map((q, idx) => (
              <span key={q.id + idx} style={{
                ...styles.progressCell,
                backgroundColor: idx < currentQIndex ? '#8ca279' : idx === currentQIndex ? '#d6b75a' : '#fff',
              }} />
            ))}
            <span style={styles.progressText}>{currentQIndex + 1}/{questions.length}</span>
          </div>

          <div style={styles.qBox}>
            {currentQ.imageUrl && (
              <img src={currentQ.imageUrl} alt="題目附圖" style={styles.qImage} />
            )}
            <div style={styles.qText}>{currentQ.content}</div>

            {/* 🌟 重測時把老師提示放在題目下方，不用自己記住上一頁的提示 */}
            {!isFirstRound && (
              <div style={styles.explanationBox}>
                💡 <strong>提示：</strong>{currentQ.explanation || '再仔細看一次題目，想想上課教過的內容喔！'}
              </div>
            )}

          </div>

          <div style={styles.optionsGrid}>
            {['A', 'B', 'C', 'D'].map(opt => (
              currentQ.options[opt] && (
                <button
                  key={opt}
                  className={`pixel-btn btn-paper ${selectedOpt === opt ? 'is-pressed' : ''} ${feedback ? 'is-locked' : ''}`}
                  style={{
                    ...styles.optBtn,
                    ...(feedback === 'wrong' && selectedOpt === opt ? styles.optWrong : null),
                  }}
                  aria-pressed={selectedOpt === opt}
                  aria-disabled={!!feedback}
                  onClick={() => { if (!feedback) setSelectedOpt(opt); }}
                >
                  <span style={styles.optLetter}>{opt}</span>
                  <span style={{ flex: 1 }}>{currentQ.options[opt]}</span>
                  {/* 印章蓋在孩子選的那顆上，手指在哪裡回饋就在哪裡 */}
                  {feedback && selectedOpt === opt && (
                    <span className="answer-stamp" style={styles.optStamp} aria-hidden="true">{feedback === 'correct' ? '⭕' : '❌'}</span>
                  )}
                </button>
              )
            ))}
          </div>

          {/* 確定鈕黏在畫面底部，題目長也不用捲；送出後直接變成對錯結果列 */}
          <div style={styles.confirmBar}>
            {feedback ? (
              <div
                role="status"
                className="answer-stamp"
                style={{ ...styles.resultBar, ...(feedback === 'correct' ? styles.resultCorrect : styles.resultWrong) }}
              >
                {feedback === 'correct' ? '⭕ 答對了！' : (isFirstRound ? '❌ 答錯了，等一下還有機會' : '❌ 可惜，看看結算頁的答案')}
              </div>
            ) : (
              <button
                className="pixel-btn btn-blue"
                style={styles.actionBtn}
                disabled={!selectedOpt}
                onClick={confirmAnswer}
              >
                {selectedOpt ? `✔ 確定選 ${selectedOpt}` : '先點一個答案'}
              </button>
            )}
          </div>
        </div>
      )}

      {gameState === 'reviewMistakes' && (
        <div className="pixel-card" style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button className="pixel-btn btn-ghost" style={styles.leaveBtn} onClick={() => setShowLeaveConfirm(true)}>✕ 離開</button>
          </div>
          <h2 style={styles.title}>🧐 再想一想！</h2>
          <p style={styles.lead}>看完提示，答錯的 {mistakes.length} 題可以再挑戰一次。<br />這是最後一次機會，加油！</p>

          <div style={styles.mistakeList}>
            {mistakes.map((m, idx) => (
              <div key={idx} style={styles.mistakeItem}>
                <div style={styles.mistakeQ}>{m.content || '(圖片題)'}</div>
                <div style={styles.explanationBox}>
                  💡 <strong>{m.explanation ? '老師提示：' : '提示：'}</strong>{m.explanation || '請再仔細檢查一下題目，或者回想一下上課的內容喔！'}
                </div>
              </div>
            ))}
          </div>

          <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={handleRetryMistakes}>
            ⚔️ 我準備好了，再挑戰一次！
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>{finalScore === totalQuestions ? '🎉 完美過關！' : '📊 測驗結束！'}</h2>

          <div style={styles.scoreRow}>
            <div className="pixel-box" style={styles.scoreBox}>
              <div style={styles.scoreLabel}>第一次</div>
              <div style={styles.scoreNum}>{firstTryScore}<small style={styles.scoreTotal}>/{totalQuestions}</small></div>
            </div>
            <div className="pixel-box" style={styles.scoreBox}>
              <div style={styles.scoreLabel}>最後成績</div>
              <div style={styles.scoreNum}>{finalScore}<small style={styles.scoreTotal}>/{totalQuestions}</small></div>
            </div>
          </div>

          {coinsEarned > 0 ? (
            <div role="status" aria-label={coinSave === 'saved' ? `獲得 ${coinsEarned} 金幣` : undefined}>
              {coinSave === 'saved' && (
                <div className="pixel-badge coin-pop" style={styles.coinBadge}>
                  <img src={moneyIconImg} alt="" style={{height: '36px'}} />
                  <span aria-hidden="true">+{shownCoins} 金幣</span>
                </div>
              )}
              {coinSave === 'saving' && (
                <div className="pixel-box" style={styles.coinPending}>⏳ 金幣存進去中…</div>
              )}
              {coinSave === 'error' && (
                <div className="pixel-box" style={styles.coinPending}>
                  <p style={{ margin: '0 0 10px' }}>😅 {coinsEarned} 金幣還沒存好，可能是網路斷掉了。</p>
                  <button className="pixel-btn btn-yellow" style={styles.dialogBtn} onClick={() => saveCoins(coinsEarned)}>🔄 再存一次</button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.encourage}>{finalScore === totalQuestions ? '全部答對，太厲害了！' : '辛苦了，再接再厲！'}</div>
          )}

          {/* 🌟 兩次機會後仍答錯的題目，繼續給提示但不顯示答案，讓學生知道還要加強哪裡 */}
          {finalMistakes.length > 0 && (
            <div style={{textAlign: 'left', marginBottom: '20px'}}>
              <h3 style={styles.subHeading}>💪 這幾題再看一次答案：</h3>
              <div style={styles.mistakeList}>
                {finalMistakes.map((m, idx) => (
                  <div key={idx} style={styles.mistakeItem}>
                    <div style={styles.mistakeQ}>{m.content || '(圖片題)'}</div>
                    <div style={styles.answerReveal}>✅ 正確答案：{m.options?.[m.correct_answer]}</div>
                    {m.explanation && (
                      <div style={styles.explanationBox}>💡 <strong>老師提示：</strong>{m.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {coinsEarned > 0 && coinSave === 'saved' && (
            <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => onBack('shop')}>🛍️ 去商城逛逛</button>
          )}
          <button
            className={`pixel-btn ${coinsEarned > 0 && coinSave === 'saved' ? 'btn-ghost' : 'btn-blue'}`}
            style={{...styles.actionBtn, ...(coinsEarned > 0 && coinSave === 'saved' ? styles.secondaryBtn : null)}}
            onClick={() => onBack()}
          >
            回首頁
          </button>
        </div>
      )}

      {showLeaveConfirm && (
        <PixelDialog
          title="要離開測驗嗎？"
          onClose={() => setShowLeaveConfirm(false)}
          actions={<>
            <button className="pixel-btn btn-blue" style={styles.dialogBtn} onClick={() => setShowLeaveConfirm(false)}>繼續作答</button>
            <button className="pixel-btn btn-ghost" style={styles.dialogBtn} onClick={() => onBack()}>離開</button>
          </>}
        >
          現在離開的話，這次測驗<strong>拿不到金幣</strong>喔！
        </PixelDialog>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '760px', margin: '0 auto', padding: '16px 16px 48px', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', color: '#4a4a4a' },
  card: { padding: 'clamp(16px, 4vw, 30px)', textAlign: 'center', backgroundColor: '#f2efeb' },
  title: { fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: '#4a4a4a', borderBottom: '4px dashed #4a4a4a', paddingBottom: '12px', margin: '0 0 20px' },
  ruleList: { listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left', fontSize: '1.25rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '8px' },
  lead: { fontSize: '1.2rem', lineHeight: 1.5, margin: '0 0 20px' },
  actionBtn: { padding: '14px', fontSize: 'clamp(1.2rem, 4.5vw, 1.5rem)', width: '100%', minHeight: '56px' },
  secondaryBtn: { marginTop: '16px', fontSize: '1.2rem', minHeight: '48px' },
  dialogBtn: { width: '100%', minHeight: '52px', fontSize: '1.2rem' },

  playHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  roundLabel: { fontSize: '1.2rem', fontWeight: 'bold' },
  leaveBtn: { minHeight: '44px', padding: '6px 14px', fontSize: '1rem' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' },
  progressCell: { flex: 1, height: '14px', border: '3px solid #4a4a4a' },
  progressText: { marginLeft: '8px', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },

  qBox: { position: 'relative', padding: 'clamp(16px, 4vw, 30px)', backgroundColor: '#fff', border: '6px solid #4a4a4a', marginBottom: '20px', textAlign: 'left' },
  qImage: { maxWidth: '100%', maxHeight: '300px', marginBottom: '15px', border: '3px dashed #9ea3a3' },
  qText: { fontSize: 'clamp(1.35rem, 5vw, 1.8rem)', color: '#4a4a4a', fontWeight: 'bold', lineHeight: '1.45' },
  confirmBar: { position: 'sticky', bottom: 0, zIndex: 5, margin: '20px -4px 0', padding: '12px 4px calc(12px + env(safe-area-inset-bottom))', backgroundColor: '#f2efeb' },
  resultBar: { minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', fontSize: '1.3rem', fontWeight: 'bold', border: '4px solid #4a4a4a', color: '#4a4a4a' },
  resultCorrect: { backgroundColor: '#d6b75a' },
  resultWrong: { backgroundColor: '#fff', borderStyle: 'dashed' },

  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '14px' },
  optBtn: { padding: '14px 16px', minHeight: '60px', fontSize: 'clamp(1.15rem, 4.2vw, 1.5rem)', textAlign: 'left', lineHeight: '1.35', display: 'flex', alignItems: 'center', gap: '14px' },
  optWrong: { backgroundColor: '#fff', borderStyle: 'dashed' },
  optStamp: { flexShrink: 0, fontSize: '1.8rem', lineHeight: 1 },
  optLetter: { flexShrink: 0, width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4a4a4a', color: '#f2efeb', fontSize: '1.1rem' },

  mistakeList: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', textAlign: 'left' },
  mistakeItem: { padding: '16px', backgroundColor: '#fff', border: '4px dashed #4a4a4a' },
  mistakeQ: { fontWeight: 'bold', fontSize: '1.25rem' },
  explanationBox: { marginTop: '14px', padding: '12px 14px', backgroundColor: '#fdf6e3', color: '#4a4a4a', border: '3px solid #4a4a4a', fontSize: '1.15rem', lineHeight: 1.5 },
  subHeading: { fontSize: '1.3rem', margin: '0 0 10px' },

  scoreRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
  scoreBox: { padding: '14px 8px' },
  scoreLabel: { fontSize: '1.1rem', fontWeight: 'bold' },
  scoreNum: { fontSize: '2.6rem', fontWeight: 'bold', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' },
  scoreTotal: { fontSize: '1.2rem' },
  coinPending: { padding: '14px', marginBottom: '24px', fontSize: '1.2rem', fontWeight: 'bold' },
  inlineNotice: { padding: '12px', marginBottom: '16px', backgroundColor: '#fdf6e3', fontSize: '1.15rem', lineHeight: 1.5, textAlign: 'left' },
  answerReveal: { marginTop: '10px', padding: '8px 12px', backgroundColor: '#e6ecdf', border: '3px solid #4a4a4a', fontWeight: 'bold', fontSize: '1.15rem' },
  coinBadge: { display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 22px', fontSize: '1.8rem', marginBottom: '24px', fontVariantNumeric: 'tabular-nums' },
  encourage: { fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '24px' },
};

export default Quiz;
