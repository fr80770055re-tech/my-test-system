import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VOCAB_LIST } from '../data/vocabData';
import moneyIconImg from '../assets/money.png';

const VocabGame = ({ user, userData, onBack }) => {
  const [gameState, setGameState] = useState('menu'); 
  const [targetWords, setTargetWords] = useState([]);
  const [dictCache, setDictCache] = useState({}); 
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [mistakes, setMistakes] = useState([]); 
  const [isFirstRound, setIsFirstRound] = useState(true); 
  const [firstTryScore, setFirstTryScore] = useState(0); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const LEVELS = {
    easy: { name: '初階修練 (1-1000字)', min: 0, max: Math.min(1000, VOCAB_LIST.length), reward: 2 },
    medium: { name: '中階修練 (1001-2500字)', min: Math.min(1001, VOCAB_LIST.length - 1), max: Math.min(2500, VOCAB_LIST.length), reward: 3 },
    hard: { name: '高階修練 (2501-5021字)', min: Math.min(2501, VOCAB_LIST.length - 1), max: VOCAB_LIST.length, reward: 5 }
  };
  const [selectedLevel, setSelectedLevel] = useState(null);
  const fallbackBopo = ['ㄉㄚˋ', 'ㄒㄧㄠˇ', 'ㄏㄠˇ', 'ㄕㄨㄟˇ', 'ㄇㄨˋ', 'ㄏㄨㄛˇ', 'ㄊㄧㄢ', 'ㄖㄣˊ', 'ㄕㄢ', 'ㄕˊ'];

  const startGame = async (levelKey) => {
    const level = LEVELS[levelKey];
    setSelectedLevel(level);
    
    const availableWords = VOCAB_LIST.slice(level.min, level.max);
    if (availableWords.length < 20) return alert("⚠️ 此難度的字庫數量不足 20 字喔！");

    let picked = [];
    while (picked.length < 20) {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      if (!picked.includes(randomWord)) picked.push(randomWord);
    }
    
    setTargetWords(picked);
    setGameState('loading'); 

    let newCache = {};
    await Promise.all(picked.map(async (word) => {
      try {
        const res = await fetch(`https://www.moedict.tw/a/${encodeURIComponent(word)}.json`);
        if (res.ok) {
          const data = await res.json();
          let bopoArray = [];
          let examples = [];
          
          if (data.h && data.h.length > 0) {
            for (let entry of data.h) {
              if (entry.b) {
                let cleanBopo = entry.b.replace(/<[^>]*>?/gm, '').replace(/[~`]/g, '').trim();
                if (cleanBopo && !bopoArray.includes(cleanBopo)) {
                  bopoArray.push(cleanBopo);
                }
              }
              const defs = entry.d || [];
              for (let d of defs) {
                if (d.e && d.e.length > 0) examples.push(...d.e);
                else if (d.f) examples.push(d.f);
              }
            }
          }

          const cleanExamples = examples
            .map(ex => ex.replace(/<[^>]*>?/gm, '').replace(/[~`]/g, ''))
            .filter((v, i, a) => a.indexOf(v) === i) 
            .slice(0, 3);

          newCache[word] = { 
            bopomofo: bopoArray.join(' / ') || '無讀音', 
            examples: cleanExamples 
          };
        } else {
          newCache[word] = { bopomofo: '查無讀音', examples: [] };
        }
      } catch (error) {
        newCache[word] = { bopomofo: '連線錯誤', examples: [] };
      }
    }));

    setDictCache(newCache);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setFirstTryScore(0);
    setIsFirstRound(true);
    setMistakes([]);
    setGameState('flashcard');
  };

  const startQuiz = () => {
    const generatedQuestions = targetWords.map(target => {
      const correctBopo = dictCache[target].bopomofo;
      let options = [correctBopo];
      
      // 先打亂其他字的注音，確保每次抓到的干擾選項不一樣
      const otherBopos = targetWords
        .map(w => dictCache[w].bopomofo)
        .filter(b => b !== correctBopo)
        .sort(() => Math.random() - 0.5); 
        
      // 🌟 關鍵修復：湊滿 4 個選項就立刻踩煞車 (break)
      for (let b of otherBopos) {
        if (options.length >= 4) break; 
        if (!options.includes(b)) options.push(b);
      }
      
      // 如果這 20 個字音重複太高，導致選項還是不夠 4 個，再用備用注音補齊
      for (let fb of fallbackBopo) {
        if (options.length >= 4) break;
        if (!options.includes(fb)) options.push(fb);
      }
      return { targetWord: target, options: options.sort(() => Math.random() - 0.5) }; 
    });
    
    setQuestions(generatedQuestions.sort(() => Math.random() - 0.5)); 
    setCurrentQuizIndex(0);
    setMistakes([]);
    setGameState('quiz');
  };

  const handleAnswer = (selectedBopo) => {
    const currentQ = questions[currentQuizIndex];
    const correctBopo = dictCache[currentQ.targetWord].bopomofo;
    const isCorrect = (selectedBopo === correctBopo);

    if (isCorrect && isFirstRound) {
      setFirstTryScore(prev => prev + 1); 
    }

    const updatedMistakes = !isCorrect ? [...mistakes, currentQ] : mistakes;
    if (!isCorrect) {
      setMistakes(updatedMistakes);
    }
    
    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      if (updatedMistakes.length > 0) {
        setGameState('reviewMistakes');
      } else {
        finishGame();
      }
    }
  };

  const handleRetryMistakes = () => {
    const newQuestions = mistakes.map(m => ({
      ...m,
      options: m.options.sort(() => Math.random() - 0.5)
    }));
    
    setQuestions(newQuestions.sort(() => Math.random() - 0.5));
    setMistakes([]);
    setCurrentQuizIndex(0);
    setIsFirstRound(false); 
    setGameState('quiz');
  };

  const finishGame = async () => {
    setGameState('result');
    setIsSubmitting(true);
    try {
      const newCoins = (userData.coins || 0) + selectedLevel.reward;
      await updateDoc(doc(db, "users", user.uid), { coins: newCoins });
      userData.coins = newCoins; 
    } catch (error) {
      console.error("金幣發放失敗", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={styles.container}>
      {/* 1. 選單 */}
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>📖 識字修練場</h2>
          <p style={styles.desc}>記住字音與造詞，測驗需全對才能通關。答錯沒關係，系統會讓你反覆練習直到學會為止！</p>
          <div style={styles.btnGroup}>
            {Object.entries(LEVELS).map(([key, level]) => (
              <button key={key} className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => startGame(key)}>
                {level.name} <br/><span style={{fontSize:'1.1rem', color:'#dcdfdc'}}>🎁 獎勵 {level.reward} 金幣</span>
              </button>
            ))}
          </div>
          <button className="pixel-btn btn-gray" style={{...styles.actionBtn, marginTop: '30px'}} onClick={onBack}>⬅ 返回主頁</button>
        </div>
      )}

      {/* 2. 預載畫面 */}
      {gameState === 'loading' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={{fontSize: '2rem', color: '#4a4a4a'}}>⏳ 正在準備字卡資料...</h2>
        </div>
      )}

      {/* 3. 閃卡畫面 */}
      {gameState === 'flashcard' && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={{color: '#4a4a4a', margin: '0 0 10px 0'}}>🧠 記憶時間 ({currentCardIndex + 1}/20)</h3>
          
          <div 
            className="pixel-box" 
            style={{...styles.flashcard, backgroundColor: isFlipped ? '#f9f9f9' : '#ffffff'}} 
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {!isFlipped ? (
              <>
                <div style={styles.cardHint}>👉 點擊翻面查看讀音與造詞</div>
                <div style={styles.cardWordBig}>{targetWords[currentCardIndex]}</div>
              </>
            ) : (
              <div style={styles.cardBack}>
                <div style={styles.cardHint}>👉 點擊翻回正面</div>
                <div style={styles.wordHeader}>
                  <div style={styles.cardWordSmall}>{targetWords[currentCardIndex]}</div>
                  <div style={styles.zhuyinBadge}>
                    讀音：{dictCache[targetWords[currentCardIndex]]?.bopomofo}
                  </div>
                </div>
                <div style={styles.examplesContainer}>
                  <div style={styles.exampleTitle}>💡 補充造詞 / 解釋：</div>
                  {dictCache[targetWords[currentCardIndex]]?.examples?.map((ex, i) => (
                      <div key={i} style={styles.exampleItem}>• {ex}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{display: 'flex', gap: '15px', justifyContent: 'center', width: '100%'}}>
            {currentCardIndex > 0 && (
              <button 
                className="pixel-btn btn-gray" 
                style={{...styles.actionBtn, flex: 1}} 
                onClick={() => {
                  setCurrentCardIndex(prev => prev - 1);
                  setIsFlipped(false);
                }}
              >
                ⬅ 上一個字
              </button>
            )}
            
            {currentCardIndex < 19 ? (
              <button 
                className="pixel-btn btn-yellow" 
                style={{...styles.actionBtn, flex: currentCardIndex === 0 ? 'none' : 1, width: currentCardIndex === 0 ? '100%' : 'auto'}} 
                onClick={() => {
                  setCurrentCardIndex(prev => prev + 1);
                  setIsFlipped(false); 
                }}
              >
                下一個字 ➔
              </button>
            ) : (
              <button className="pixel-btn btn-red" style={{...styles.actionBtn, flex: 1}} onClick={startQuiz}>
                ⚔️ 開始驗收！
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. 測驗畫面 */}
      {gameState === 'quiz' && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={{color: '#4a4a4a', margin: '0 0 10px 0'}}>
            🎯 {isFirstRound ? '讀音大考驗' : '補考時間'} ({currentQuizIndex + 1}/{questions.length})
          </h3>
          
          <div style={styles.quizPromptBox}>
            請問 <span style={styles.quizTargetWord}>「{questions[currentQuizIndex].targetWord}」</span> 的讀音是什麼？
          </div>
          
          {/* 🌟 測驗選項區塊，維持完美的 2x2 網格 */}
          <div style={styles.optionsGrid}>
            {questions[currentQuizIndex].options.map((opt, idx) => (
              <button key={idx} className="pixel-btn btn-blue" style={styles.optionBtnBopo} onClick={() => handleAnswer(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. 錯誤複習畫面 */}
      {gameState === 'reviewMistakes' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={{...styles.title, color: '#c0392b'}}>😵 哎呀！有幾個字音要再記一下喔！</h2>
          <p style={{fontSize: '1.2rem'}}>先複習一下剛剛答錯的 {mistakes.length} 個字，確認記起來後再挑戰一次！</p>
          
          <div style={styles.mistakeList}>
            {mistakes.map((m, idx) => (
              <div key={idx} style={styles.mistakeItem}>
                <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{m.targetWord}</div>
                <div style={{fontSize: '1.5rem', color: '#d6b75a', backgroundColor: '#4a4a4a', padding: '5px 15px', borderRadius: '5px'}}>
                  {dictCache[m.targetWord].bopomofo}
                </div>
              </div>
            ))}
          </div>
          
          <button className="pixel-btn btn-red" style={styles.actionBtn} onClick={handleRetryMistakes}>
            ⚔️ 我記起來了，再次挑戰！
          </button>
        </div>
      )}

      {/* 6. 結算畫面 */}
      {gameState === 'result' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>🎉 完美通關</h2>
          <div className="pixel-box" style={styles.scoreBox}>
            第一次作答正確數：<span style={{fontSize:'2.5rem', fontWeight:'bold', color:'#8ca279'}}>{firstTryScore}</span> / 20
            
            <div style={{marginTop: '20px'}}>
               <div style={{color: '#d6b75a', fontSize: '1.5rem', fontWeight: 'bold'}}>
                 太棒了！你克服了所有錯題，成功獲得 <img src={moneyIconImg} alt="money" style={styles.moneyIcon} /> {selectedLevel.reward} 金幣！
               </div>
            </div>
          </div>
          
          <div style={styles.btnGroup}>
            <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => setGameState('menu')} disabled={isSubmitting}>挑選新字庫</button>
            <button className="pixel-btn btn-gray" style={styles.actionBtn} onClick={onBack} disabled={isSubmitting}>回首頁</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' },
  card: { padding: '30px', textAlign: 'center', backgroundColor: '#f2efeb' },
  title: { fontSize: '2.2rem', color: '#4a4a4a', borderBottom: '4px dashed #4a4a4a', paddingBottom: '15px', marginBottom: '20px' },
  desc: { fontSize: '1.3rem', color: '#4a4a4a', marginBottom: '30px' },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '15px' },
  actionBtn: { padding: '15px', fontSize: '1.5rem', width: '100%' },
  
  flashcard: { position: 'relative', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '20px 0', border: '8px solid #4a4a4a', cursor: 'pointer', transition: 'background-color 0.2s' },
  cardHint: { position: 'absolute', top: '15px', width: '100%', textAlign: 'center', fontSize: '1.1rem', color: '#7f8c8d' },
  cardWordBig: { fontSize: '9rem', fontWeight: 'bold', color: '#2c3e50', marginTop: '20px' },
  cardBack: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 20px 20px', boxSizing: 'border-box' },
  wordHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
  cardWordSmall: { fontSize: '4.5rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '10px' },
  zhuyinBadge: { backgroundColor: '#d6b75a', color: '#4a4a4a', padding: '8px 15px', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #4a4a4a' },
  examplesContainer: { width: '100%', textAlign: 'left', padding: '0 10px' },
  exampleTitle: { fontSize: '1.4rem', color: '#6e85b7', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #6e85b7', paddingBottom: '5px' },
  exampleItem: { fontSize: '1.3rem', color: '#4a4a4a', marginBottom: '12px', lineHeight: '1.4' },
  
  quizPromptBox: { padding: '20px', backgroundColor: '#e8e8e8', fontSize: '1.5rem', color: '#4a4a4a', border: '4px solid #4a4a4a', margin: '20px 0', fontWeight: 'bold' },
  quizTargetWord: { fontSize: '2.5rem', color: '#c0392b' }, 
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  optionBtnBopo: { fontSize: '1.8rem', padding: '25px 10px', lineHeight: '1.3' }, 
  
  mistakeList: { display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0', maxHeight: '300px', overflowY: 'auto', padding: '10px', backgroundColor: '#e8e8e8', border: '4px solid #4a4a4a' },
  mistakeItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px', border: '2px dashed #4a4a4a' },
  
  scoreBox: { padding: '30px', backgroundColor: '#e8e8e8', margin: '20px 0' },
  moneyIcon: { height: '30px', objectFit: 'contain', verticalAlign: 'middle' },
};

export default VocabGame;