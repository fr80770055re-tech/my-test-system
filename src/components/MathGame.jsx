import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import moneyIconImg from '../assets/money.png';

const MathGame = ({ user, userData, onBack }) => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'result'
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  
  const [currentQ, setCurrentQ] = useState(null);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 用來儲存計時器，方便隨時清除
  const timerRef = useRef(null);

  // 🎲 隨機產生九九乘法題目與選項
  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
    const b = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
    const answer = a * b;

    // 產生三個誘答選項 (包含常見的加減錯誤或鄰近乘法)
    let options = [answer];
    const distractors = [
      (a + 1) * b, a * (b + 1), (a - 1) * b || a, a * (b - 1) || b,
      answer + 10, answer - 10, answer + 2, answer - 2
    ];

    while (options.length < 4) {
      const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
      if (!options.includes(randomDistractor) && randomDistractor > 0) {
        options.push(randomDistractor);
      }
    }

    setCurrentQ({
      text: `${a} × ${b} = ?`,
      answer: answer,
      options: options.sort(() => Math.random() - 0.5) // 打亂選項
    });
  };

  const startGame = (seconds) => {
    setTimeLimit(seconds);
    setTimeLeft(seconds);
    setScore(0);
    generateQuestion();
    setGameState('playing');
  };

  // ⏱️ 計時器邏輯
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  // 處理作答 (為了講求速度，點錯不扣分，直接換下一題)
  const handleAnswer = (selected) => {
    if (selected === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
    generateQuestion(); // 無論對錯，立刻換題保持節奏
  };

  // 結算與發放金幣
  const endGame = async () => {
    clearInterval(timerRef.current);
    setGameState('result');
    setIsSubmitting(true);

    let coins = 0;
    // 🎁 依照我們設定的獎賞級距計算
    if (timeLimit === 60) {
      if (score >= 30) coins = 5;
      else if (score >= 20) coins = 3;
      else if (score >= 10) coins = 1;
    } else if (timeLimit === 120) {
      if (score >= 60) coins = 10;
      else if (score >= 40) coins = 6;
      else if (score >= 20) coins = 2;
    }

    setEarnedCoins(coins);

    if (coins > 0) {
      try {
        const newCoins = (userData.coins || 0) + coins;
        await updateDoc(doc(db, "users", user.uid), { coins: newCoins });
        userData.coins = newCoins; // 即時更新畫面狀態
      } catch (error) {
        console.error("金幣發放失敗", error);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div style={styles.container}>
      {/* --- 選單畫面 --- */}
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>✖️ 九九乘法道場</h2>
          <p style={styles.desc}>挑戰你的直覺反射！在時間內答對越多題，獲得的金幣越多！</p>
          
          <div style={styles.btnGroup}>
            <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => startGame(60)}>
              ⏱️ 60秒 極速挑戰 <br/><span style={{fontSize:'1.1rem', color:'#dcdfdc'}}>(最高獎勵 5 金幣)</span>
            </button>
            <button className="pixel-btn btn-green" style={styles.actionBtn} onClick={() => startGame(120)}>
              ⏱️ 120秒 耐力挑戰 <br/><span style={{fontSize:'1.1rem', color:'#dcdfdc'}}>(最高獎勵 10 金幣)</span>
            </button>
          </div>
          <button className="pixel-btn btn-gray" style={{...styles.actionBtn, marginTop: '30px'}} onClick={onBack}>⬅ 返回主頁</button>
        </div>
      )}

      {/* --- 遊戲畫面 --- */}
      {gameState === 'playing' && currentQ && (
        <div className="pixel-card" style={styles.card}>
          <div style={styles.headerInfo}>
            <div style={styles.timerBox}>
              ⏳ 剩餘時間: <span style={{color: timeLeft <= 10 ? '#c0392b' : '#4a4a4a'}}>{timeLeft}</span> 秒
            </div>
            <div style={styles.scoreBox}>
              ✅ 答對: {score} 題
            </div>
          </div>

          <div className="pixel-box" style={styles.questionDisplay}>
            {currentQ.text}
          </div>

          <div style={styles.optionsGrid}>
            {currentQ.options.map((opt, idx) => (
              <button key={idx} className="pixel-btn btn-blue" style={styles.optionBtnNum} onClick={() => handleAnswer(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- 結算畫面 --- */}
      {gameState === 'result' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>結算報告</h2>
          <div className="pixel-box" style={styles.resultBox}>
            挑戰時間：{timeLimit} 秒 <br/>
            答對題數：<span style={{fontSize:'2.5rem', fontWeight:'bold', color:'#8ca279'}}>{score}</span> 題
            
            <div style={{marginTop: '20px'}}>
              {earnedCoins > 0 ? (
                <div style={{color: '#d6b75a', fontSize: '1.5rem', fontWeight: 'bold'}}>
                  🎉 恭喜！獲得 <img src={moneyIconImg} alt="money" style={styles.moneyIcon} /> {earnedCoins} 金幣！
                </div>
              ) : (
                <div style={{color: '#b97a7a', fontSize: '1.3rem'}}>
                  😢 加油！下次答對更多題就能拿到獎勵囉！
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.btnGroup}>
            <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => setGameState('menu')} disabled={isSubmitting}>再次挑戰</button>
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
  
  headerInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' },
  timerBox: { padding: '10px', backgroundColor: '#e8e8e8', border: '4px solid #4a4a4a' },
  scoreBox: { padding: '10px', backgroundColor: '#e8e8e8', border: '4px solid #4a4a4a', color: '#8ca279' },
  
  questionDisplay: { fontSize: '6rem', fontWeight: 'bold', color: '#2c3e50', padding: '40px 0', margin: '20px 0', backgroundColor: '#fff', border: '8px solid #4a4a4a' },
  
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  optionBtnNum: { fontSize: '3.5rem', padding: '20px 0', fontFamily: 'Arial, sans-serif' }, 
  
  resultBox: { padding: '30px', backgroundColor: '#e8e8e8', margin: '20px 0', fontSize: '1.4rem', color: '#4a4a4a', lineHeight: '1.8' },
  moneyIcon: { height: '30px', objectFit: 'contain', verticalAlign: 'middle' },
};

export default MathGame;