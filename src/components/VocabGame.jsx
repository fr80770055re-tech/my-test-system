import { useMemo, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VOCAB_LIST } from '../data/vocabdata';
import moneyIconImg from '../assets/money.png';
import StrokeOrder from './StrokeOrder';
import WordFlower from './WordFlower';
import flowerIcon from '../assets/plant_flower_pink_01.png';
import { BADGES, countMastered, updateStats, newlyEarned } from '../utils/badges';
import { todayNumber, shuffle, summarize, mistakeChars, cardTag, pickRound, applyResult, MASTERED_LEVEL } from '../utils/vocabProgress';
import { buildIndexes, makeQuestion } from '../utils/vocabQuiz';

// 🌟 生字本體改用楷體風格字型（跨平台的 LXGW WenKai TC），筆順字形比一般黑體更貼近課本教學
const KAITI_FONT = '"LXGW WenKai TC", "標楷體", "DFKai-SB", serif';

const SOURCE_LABELS = {
  moedict: '教育部《重編國語辭典修訂本》',
  variant: '教育部《重編國語辭典修訂本》',
  crossStrait: '教育部《兩岸常用詞典》',
  unihan: 'Unicode 漢字資料庫（僅讀音）',
  manual: '老師補充',
  mini: '教育部《國語小字典》',
};

// 🌟 字卡背面：標準筆順動畫、部首筆畫、每個讀音的字義，以及常用詞
const CardBack = ({ char, info }) => {
  if (!info) return null;
  const sources = [...new Set(info.readings.map(r => SOURCE_LABELS[r.defSource === 'mini' ? 'mini' : r.source]).filter(Boolean))];

  return (
    <div style={styles.cardBack}>
      <div style={styles.cardHint}>👉 點擊空白處翻回正面</div>

      <div style={styles.backHeader}>
        <StrokeOrder char={char} size={170} fontFamily={KAITI_FONT} />
        <div style={styles.backMeta}>
          {info.radical && <div>部首：<b style={{fontFamily: KAITI_FONT}}>{info.radical}</b></div>}
          {info.strokes && <div>總筆畫：<b>{info.strokes}</b> 畫</div>}
          {info.variantOf && <div style={{color: '#7f8c8d'}}>「{char}」是「<span style={{fontFamily: KAITI_FONT}}>{info.variantOf}</span>」的異體字</div>}
        </div>
      </div>

      <div style={styles.readingsContainer}>
        {info.readings.map((r, i) => (
          <div key={i} style={styles.readingBlock}>
            <span style={styles.zhuyinBadge}>{r.bopomofo}</span>
            {r.defs.length > 0 ? (
              <ol style={styles.defList}>
                {r.defs.slice(0, 3).map((d, j) => (
                  <li key={j} style={styles.defItem}>
                    {d.type && <span style={styles.typeTag}>{d.type}</span>}
                    {d.def}
                    {d.example && <div style={styles.defExample}>{d.example}</div>}
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{...styles.defItem, color: '#95a5a6', marginTop: '8px'}}>（此讀音暫無字義資料）</div>
            )}
          </div>
        ))}
      </div>

      {info.words.length >= 2 ? (
        <div style={styles.flowerSection}>
          <div style={styles.flowerTitle}><img src={flowerIcon} alt="" style={styles.inlineIcon} />花瓣識字：常用詞</div>
          <WordFlower center={char} petals={info.words.slice(0, 6)} fontFamily={KAITI_FONT} />
        </div>
      ) : info.words.length === 1 && (
        <div style={styles.wordsRow}>
          <span style={{fontWeight: 'bold', color: '#6e85b7'}}>💡 常用詞：</span>
          <span style={styles.wordChip}>{info.words[0]}</span>
        </div>
      )}

      <div style={styles.sourceNote}>字音字義：{sources.join('、')}｜筆順：教育部《常用國字標準字體筆順》</div>
    </div>
  );
};

const TAG_LABELS = {
  new: { text: '🆕 新字', color: '#6e85b7' },
  review: { text: '🔁 複習', color: '#8ca279' },
  mistake: { text: '📕 錯字', color: '#c0392b' },
};

const LEVELS = {
  easy: { name: '初階修練 (1-1000字)', min: 0, max: 1000, reward: 2 },
  medium: { name: '中階修練 (1001-2500字)', min: 1000, max: 2500, reward: 10 },
  hard: { name: '高階修練 (2501-5021字)', min: 2500, max: VOCAB_LIST.length, reward: 15 },
};
const LEVEL_CHARS = Object.fromEntries(
  Object.entries(LEVELS).map(([key, level]) => [key, [...new Set(VOCAB_LIST.slice(level.min, level.max))]]),
);
const MISTAKE_MODE = { name: '錯字本複習', reward: 5, isMistakes: true };
const ROUND_SIZE = 20;

const VocabGame = ({ user, userData, onBack }) => {
  const [gameState, setGameState] = useState('menu');
  const [targetWords, setTargetWords] = useState([]);
  const [dictCache, setDictCache] = useState({});
  const [cardTags, setCardTags] = useState({});

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [isFirstRound, setIsFirstRound] = useState(true);
  const [firstTryResults, setFirstTryResults] = useState({});
  const [roundSummary, setRoundSummary] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [today] = useState(todayNumber);
  const quizContext = useRef(null);

  // 🌟 識字進度存在學生自己的 users 文件（vocab 欄位），StudentHome 即時監聽，存完會自動更新
  const progress = useMemo(() => userData.vocab || {}, [userData.vocab]);
  const mistakeList = useMemo(() => mistakeChars(progress), [progress]);
  const earnedBadges = userData.badges || {};

  const startGame = async (levelKey) => {
    const level = levelKey === 'mistakes' ? MISTAKE_MODE : LEVELS[levelKey];
    const now = todayNumber();
    let picked;
    let poolMax;
    if (level.isMistakes) {
      picked = shuffle(mistakeList.slice(0, ROUND_SIZE));
      poolMax = Math.max(LEVELS.easy.max, ...picked.map(c => VOCAB_LIST.indexOf(c) + 1));
    } else {
      picked = pickRound(LEVEL_CHARS[levelKey], progress, now, ROUND_SIZE);
      poolMax = level.max;
    }
    if (picked.length === 0) return alert("錯字本目前是空的，太厲害了！");

    setSelectedLevel(level);
    setGameState('loading');

    // 🌟 字音字義改讀事先建好的本地字典（scripts/build-dict.js 產生），不再即時連萌典，避免查無讀音或連線失敗
    let dict;
    try {
      dict = (await import('../data/dictData.json')).default;
    } catch (error) {
      console.error("字典資料載入失敗", error);
      alert("字卡資料載入失敗，請確認網路連線後再試一次！");
      setGameState('menu');
      return;
    }

    picked = picked.filter(c => dict[c]);
    // 🌟 錯誤選項只從「同級或更簡單」的字挑，避免出現學生沒學過的罕用字
    quizContext.current = { dict, idx: buildIndexes(dict, [...new Set(VOCAB_LIST.slice(0, poolMax))]) };

    const newCache = {};
    for (const word of picked) {
      const entry = dict[word];
      newCache[word] = {
        bopomofo: [...new Set(entry.readings.map(r => r.bopomofo))].join(' / '),
        readings: entry.readings,
        words: entry.words,
        radical: entry.radical || '',
        strokes: entry.strokes || null,
        variantOf: entry.variantOf || null,
      };
    }

    setTargetWords(picked);
    setDictCache(newCache);
    setCardTags(Object.fromEntries(picked.map(c => [c, cardTag(progress[c])])));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setFirstTryResults({});
    setRoundSummary(null);
    setIsFirstRound(true);
    setMistakes([]);
    setGameState('flashcard');
  };

  const startQuiz = () => {
    const { dict, idx } = quizContext.current;
    setQuestions(shuffle(targetWords.map(c => makeQuestion(c, dict, idx))));
    setCurrentQuizIndex(0);
    setMistakes([]);
    setGameState('quiz');
  };

  const handleAnswer = (selected) => {
    const currentQ = questions[currentQuizIndex];
    const isCorrect = selected === currentQ.answer;

    // 🌟 直接把最新結果傳給 finishGame，避免最後一題的結果還沒寫進 state 就結算
    const updatedResults = isFirstRound ? { ...firstTryResults, [currentQ.targetWord]: isCorrect } : firstTryResults;
    if (isFirstRound) setFirstTryResults(updatedResults);

    const updatedMistakes = isCorrect ? mistakes : [...mistakes, currentQ];
    if (!isCorrect) setMistakes(updatedMistakes);

    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else if (updatedMistakes.length > 0) {
      setGameState('reviewMistakes');
    } else {
      finishGame(updatedResults);
    }
  };

  const handleRetryMistakes = () => {
    setQuestions(shuffle(mistakes.map(m => ({ ...m, options: shuffle(m.options) }))));
    setMistakes([]);
    setCurrentQuizIndex(0);
    setIsFirstRound(false);
    setGameState('quiz');
  };

  const finishGame = async (results) => {
    setGameState('result');
    setIsSubmitting(true);

    const now = todayNumber();
    const score = targetWords.filter(c => results[c]).length;
    // 🌟 比照 Quiz.jsx：依「第一次作答」的正確率等比例發放獎勵，而非只要通關就給全額
    const coins = Math.max(0, Math.round(selectedLevel.reward * (score / targetWords.length)));

    const updates = {};
    const mergedVocab = { ...progress };
    let newChars = 0;
    let newlyMastered = 0;
    let toMistakeBook = 0;
    let rescued = 0;
    for (const c of targetWords) {
      const before = progress[c];
      const after = applyResult(before, results[c] === true, now);
      updates[`vocab.${c}`] = after;
      mergedVocab[c] = after;
      if (!before) newChars++;
      if (after.b >= MASTERED_LEVEL && (!before || before.b < MASTERED_LEVEL)) newlyMastered++;
      if (after.b === 0) toMistakeBook++;
      if (before?.b === 0 && after.b > 0) rescued++;
    }

    // 🌟 徽章：更新累計數據後檢查有沒有新達成的成就，達成就加發金幣
    const flowerCorrect = questions.filter(qq => qq.type === 'flower' && results[qq.targetWord]).length;
    const stats = updateStats(userData.stats, {
      perfect: score === targetWords.length,
      hard: selectedLevel === LEVELS.hard,
      flowerCorrect,
      rescued,
    }, now);
    const earned = newlyEarned(userData.badges || {}, stats, countMastered(mergedVocab));
    const bonus = earned.reduce((sum, b) => sum + b.reward, 0);
    earned.forEach(b => { updates[`badges.${b.id}`] = now; });

    setRoundSummary({ score, coins, newChars, newlyMastered, toMistakeBook, earned, bonus });

    try {
      await updateDoc(doc(db, "users", user.uid), { coins: (userData.coins || 0) + coins + bonus, stats, ...updates });
    } catch (error) {
      console.error("識字進度儲存失敗", error);
      alert("進度儲存失敗，請確認網路連線！");
    }
    setIsSubmitting(false);
  };

  const q = questions[currentQuizIndex];

  return (
    <div style={styles.container}>
      {/* 1. 選單 */}
      {gameState === 'menu' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>📖 識字修練場</h2>
          <p style={styles.desc}>每局 {ROUND_SIZE} 字：還沒學過的新字、到期該複習的字會優先出現；答錯的字會收進錯字本，隔天再挑戰！</p>
          <div style={styles.btnGroup}>
            {Object.entries(LEVELS).map(([key, level]) => {
              const s = summarize(progress, LEVEL_CHARS[key], today);
              return (
                <button key={key} className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => startGame(key)}>
                  {level.name}
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${(s.mastered / s.total) * 100}%`}} />
                  </div>
                  <span style={styles.progressText}>
                    ✅ 已掌握 {s.mastered} / {s.total} 字{s.due > 0 ? `・🔁 待複習 ${s.due} 字` : ''}・🎁 最高 {level.reward} 金幣
                  </span>
                </button>
              );
            })}
            <button
              className={`pixel-btn ${mistakeList.length > 0 ? 'btn-red' : 'btn-gray'}`}
              style={styles.actionBtn}
              disabled={mistakeList.length === 0}
              onClick={() => startGame('mistakes')}
            >
              📕 錯字本複習（{mistakeList.length} 字）
              <br /><span style={styles.progressText}>{mistakeList.length > 0 ? `答對就能移出錯字本・🎁 最高 ${MISTAKE_MODE.reward} 金幣` : '目前沒有錯字，太棒了！'}</span>
            </button>
          </div>
          <button className="pixel-btn btn-yellow" style={{...styles.actionBtn, marginTop: '15px', color: '#4a4a4a'}} onClick={() => setGameState('badges')}>
            🏅 我的徽章（{BADGES.filter(b => earnedBadges[b.id]).length} / {BADGES.length}）
          </button>
          <button className="pixel-btn btn-gray" style={{...styles.actionBtn, marginTop: '15px'}} onClick={onBack}>⬅ 返回主頁</button>
        </div>
      )}

      {/* 徽章牆 */}
      {gameState === 'badges' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>🏅 我的徽章</h2>
          <p style={{fontSize: '1.1rem', color: '#4a4a4a'}}>
            已收集 {BADGES.filter(b => earnedBadges[b.id]).length} / {BADGES.length} 枚・連續練習 {userData.stats?.streak || 0} 天・已掌握 {countMastered(progress)} 字
          </p>
          <div style={styles.badgeGrid}>
            {BADGES.map(b => {
              const got = Boolean(earnedBadges[b.id]);
              return (
                <div key={b.id} style={{...styles.badgeCard, opacity: got ? 1 : 0.55}}>
                  <img src={b.icon} alt={b.name} style={{...styles.badgeIcon, filter: got ? 'none' : 'grayscale(1)'}} />
                  <div style={styles.badgeName}>{got ? b.name : '？？？'}</div>
                  <div style={styles.badgeDesc}>{b.desc}</div>
                  <div style={styles.badgeReward}>{got ? '✅ 已獲得' : `🎁 ${b.reward} 金幣`}</div>
                </div>
              );
            })}
          </div>
          <button className="pixel-btn btn-gray" style={{...styles.actionBtn, marginTop: '20px'}} onClick={() => setGameState('menu')}>⬅ 回修練場選單</button>
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
          <h3 style={{color: '#4a4a4a', margin: '0 0 10px 0'}}>
            🧠 記憶時間 ({currentCardIndex + 1}/{targetWords.length})
            {cardTags[targetWords[currentCardIndex]] && (
              <span style={{...styles.cardTag, backgroundColor: TAG_LABELS[cardTags[targetWords[currentCardIndex]]].color}}>
                {TAG_LABELS[cardTags[targetWords[currentCardIndex]]].text}
              </span>
            )}
          </h3>

          <div
            className="pixel-box"
            style={{...styles.flashcard, backgroundColor: isFlipped ? '#f9f9f9' : '#ffffff'}}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {!isFlipped ? (
              <>
                <div style={styles.cardHint}>👉 點擊翻面查看讀音、筆順與字義</div>
                <div style={styles.cardWordBig}>{targetWords[currentCardIndex]}</div>
              </>
            ) : (
              <CardBack char={targetWords[currentCardIndex]} info={dictCache[targetWords[currentCardIndex]]} />
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

            {currentCardIndex < targetWords.length - 1 ? (
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

      {/* 4. 測驗畫面：看字選音／看音選字／詞語填空 */}
      {gameState === 'quiz' && q && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={{color: '#4a4a4a', margin: '0 0 10px 0'}}>
            🎯 {isFirstRound ? '識字大考驗' : '補考時間'} ({currentQuizIndex + 1}/{questions.length})
          </h3>

          <div style={styles.quizPromptBox}>
            {q.type === 'reading' && <>請問 <span style={styles.quizTargetWord}>「{q.prompt}」</span> 的讀音是什麼？</>}
            {q.type === 'char' && <>讀音 <span style={styles.quizBopomofo}>{q.prompt}</span> 是哪一個字？</>}
            {q.type === 'word' && <>哪一個字可以填進 <span style={styles.quizTargetWord}>「{q.prompt}」</span>？</>}
            {q.type === 'flower' && <><img src={flowerIcon} alt="" style={styles.inlineIcon} />哪一個字放進花心，每片花瓣都能變成詞語？</>}
          </div>

          {q.type === 'flower' && <WordFlower center="？" petals={q.petals} fontFamily={KAITI_FONT} highlight />}

          {/* 🌟 測驗選項區塊，維持完美的 2x2 網格 */}
          <div style={styles.optionsGrid}>
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                className="pixel-btn btn-blue"
                style={q.type === 'reading' ? styles.optionBtnBopo : styles.optionBtnChar}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. 錯誤複習畫面 */}
      {gameState === 'reviewMistakes' && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={{...styles.title, color: '#c0392b'}}>😵 哎呀！有幾個字要再記一下喔！</h2>
          <p style={{fontSize: '1.2rem'}}>先複習一下剛剛答錯的 {mistakes.length} 個字，確認記起來後再挑戰一次！</p>

          <div style={styles.mistakeList}>
            {mistakes.map((m, idx) => (
              <div key={idx} style={styles.mistakeItem}>
                <div style={{fontSize: '2rem', fontWeight: 300, fontFamily: KAITI_FONT}}>
                  {m.targetWord}
                  {m.type === 'word' && <span style={{fontSize: '1.3rem', color: '#7f8c8d', marginLeft: '10px'}}>（{m.word}）</span>}
                  {m.type === 'flower' && <span style={{fontSize: '1.3rem', color: '#7f8c8d', marginLeft: '10px'}}>（{m.words.join('、')}）</span>}
                </div>
                <div style={{fontSize: '1.5rem', color: '#d6b75a', backgroundColor: '#4a4a4a', padding: '5px 15px', borderRadius: '5px'}}>
                  {dictCache[m.targetWord].readings[0].bopomofo}
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
      {gameState === 'result' && roundSummary && (
        <div className="pixel-card" style={styles.card}>
          <h2 style={styles.title}>🎉 完美通關</h2>
          <div className="pixel-box" style={styles.scoreBox}>
            第一次作答正確數：<span style={{fontSize:'2.5rem', fontWeight:'bold', color:'#8ca279'}}>{roundSummary.score}</span> / {targetWords.length}

            <div style={styles.summaryRow}>
              <span style={styles.summaryChip}>🆕 新學 {roundSummary.newChars} 字</span>
              <span style={styles.summaryChip}>🏆 新掌握 {roundSummary.newlyMastered} 字</span>
              <span style={styles.summaryChip}>📕 收進錯字本 {roundSummary.toMistakeBook} 字</span>
            </div>

            {roundSummary.earned.length > 0 && (
              <div style={styles.newBadgeBox}>
                <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#c0392b'}}>🏅 獲得新徽章！（加發 {roundSummary.bonus} 金幣）</div>
                <div style={styles.newBadgeRow}>
                  {roundSummary.earned.map(b => (
                    <div key={b.id} style={styles.newBadge}>
                      <img src={b.icon} alt={b.name} style={styles.badgeIcon} />
                      <div style={styles.badgeName}>{b.name}</div>
                      <div style={styles.badgeDesc}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{marginTop: '20px'}}>
              {roundSummary.coins > 0 ? (
                <div style={{color: '#d6b75a', fontSize: '1.5rem', fontWeight: 'bold'}}>
                  太棒了！你克服了所有錯題，成功獲得 <img src={moneyIconImg} alt="money" style={styles.moneyIcon} /> {roundSummary.coins} 金幣！
                </div>
              ) : (
                <div style={{color: '#b97a7a', fontSize: '1.3rem'}}>
                  😢 這次第一次作答對率較低，沒有獲得金幣，多熟悉幾次下次就能拿到獎勵囉！
                </div>
              )}
            </div>
          </div>

          <div style={styles.btnGroup}>
            <button className="pixel-btn btn-blue" style={styles.actionBtn} onClick={() => setGameState('menu')} disabled={isSubmitting}>回修練場選單</button>
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
  cardWordBig: { fontSize: '9rem', fontWeight: 300, color: '#2c3e50', marginTop: '20px', fontFamily: KAITI_FONT },
  cardBack: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '45px 15px 15px 15px', boxSizing: 'border-box' },
  backHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '15px' },
  backMeta: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '1.2rem', color: '#4a4a4a', textAlign: 'left' },
  readingsContainer: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' },
  readingBlock: { backgroundColor: '#fff', border: '2px solid #d6b75a', padding: '10px 12px' },
  zhuyinBadge: { display: 'inline-block', backgroundColor: '#d6b75a', color: '#4a4a4a', padding: '4px 12px', fontSize: '1.4rem', fontWeight: 'bold', border: '2px solid #4a4a4a' },
  defList: { margin: '8px 0 0 0', paddingLeft: '1.4em' },
  defItem: { fontSize: '1.15rem', color: '#4a4a4a', marginBottom: '6px', lineHeight: '1.5' },
  typeTag: { display: 'inline-block', fontSize: '0.85rem', backgroundColor: '#6e85b7', color: '#fff', padding: '0 6px', marginRight: '6px', borderRadius: '3px' },
  defExample: { fontSize: '1rem', color: '#7f8c8d' },
  wordsRow: { width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '15px', textAlign: 'left', fontSize: '1.15rem' },
  wordChip: { backgroundColor: '#e8f4f8', border: '2px solid #6e85b7', padding: '2px 10px', fontFamily: KAITI_FONT, fontSize: '1.3rem' },
  flowerSection: { width: '100%', marginTop: '15px' },
  flowerTitle: { fontWeight: 'bold', color: '#c0392b', fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  inlineIcon: { height: '1.4em', verticalAlign: 'middle', marginRight: '6px' },
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', margin: '15px 0' },
  badgeCard: { backgroundColor: '#fff', border: '3px solid #4a4a4a', boxShadow: '3px 3px 0 #4a4a4a', padding: '12px 8px' },
  badgeIcon: { width: '64px', height: '64px', objectFit: 'contain' },
  badgeName: { fontWeight: 'bold', fontSize: '1.15rem', color: '#2c3e50', marginTop: '6px' },
  badgeDesc: { fontSize: '0.9rem', color: '#7f8c8d', marginTop: '4px', lineHeight: 1.4 },
  badgeReward: { fontSize: '0.9rem', color: '#d6b75a', fontWeight: 'bold', marginTop: '6px' },
  newBadgeBox: { marginTop: '20px', padding: '15px', backgroundColor: '#fdf6e3', border: '3px dashed #d6b75a' },
  newBadgeRow: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '10px' },
  newBadge: { width: '140px', backgroundColor: '#fff', border: '3px solid #4a4a4a', padding: '10px 6px' },
  sourceNote: { width: '100%', marginTop: '15px', fontSize: '0.8rem', color: '#95a5a6', textAlign: 'right' },
  
  quizPromptBox: { padding: '20px', backgroundColor: '#e8e8e8', fontSize: '1.5rem', color: '#4a4a4a', border: '4px solid #4a4a4a', margin: '20px 0', fontWeight: 'bold' },
  quizTargetWord: { fontSize: '2.5rem', color: '#c0392b', fontFamily: KAITI_FONT, fontWeight: 300 },
  quizBopomofo: { fontSize: '2rem', color: '#c0392b', backgroundColor: '#fff', padding: '2px 12px', border: '2px solid #c0392b' },
  optionBtnChar: { fontSize: 'clamp(2.2rem, 10vw, 3.2rem)', padding: '15px 6px', lineHeight: '1.2', fontFamily: KAITI_FONT, fontWeight: 300 },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  optionBtnBopo: { fontSize: 'clamp(1.1rem, 5vw, 1.8rem)', padding: '25px 6px', lineHeight: '1.3' },
  
  mistakeList: { display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0', maxHeight: '300px', overflowY: 'auto', padding: '10px', backgroundColor: '#e8e8e8', border: '4px solid #4a4a4a' },
  mistakeItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px', border: '2px dashed #4a4a4a' },
  
  scoreBox: { padding: '30px', backgroundColor: '#e8e8e8', margin: '20px 0' },
  summaryRow: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '15px' },
  summaryChip: { backgroundColor: '#fff', border: '2px solid #4a4a4a', padding: '4px 10px', fontSize: '1.1rem' },
  progressBar: { height: '10px', backgroundColor: 'rgba(255,255,255,0.35)', margin: '8px 0 6px', border: '2px solid #2c3e50' },
  progressFill: { height: '100%', backgroundColor: '#f1c40f' },
  progressText: { fontSize: '1rem', color: '#f2efeb' },
  cardTag: { display: 'inline-block', marginLeft: '10px', color: '#fff', fontSize: '0.95rem', padding: '2px 8px', verticalAlign: 'middle' },
  moneyIcon: { height: '30px', objectFit: 'contain', verticalAlign: 'middle' },
};

export default VocabGame;