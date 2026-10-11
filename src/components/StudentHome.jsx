import React, { Suspense, lazy, useState, useEffect } from 'react';

// 🌟 遊戲點進去才下載，學生主頁先快速顯示
const VocabGame = lazy(() => import('./VocabGame'));
const MathGame = lazy(() => import('./MathGame'));
const GameLoading = () => <h2 style={{ textAlign: 'center', color: '#4a4a4a' }}>⏳ 遊戲載入中...</h2>;
// 🌟 確保所有需要的 Firebase 功能都有引入
import { doc, getDoc, updateDoc, setDoc, onSnapshot, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_ITEMS, DEFAULT_BASE_URL, moneyIconImg } from '../data/shopItems';
import { useIsMobile } from '../hooks/useIsMobile';

const StudentHome = ({ user, onStartQuiz }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVocabGame, setShowVocabGame] = useState(false);
  const [showMathGame, setShowMathGame] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState('國語');
  const [selectedUnit, setSelectedUnit] = useState('ALL'); // 🌟 新增：選擇的單元/課別，'ALL' 代表綜合測驗（全部單元混合）
  const [availableUnits, setAvailableUnits] = useState([]); // 🌟 新增：目前選擇科目下，老師已建立的單元清單
  const [quizMode, setQuizMode] = useState('formal');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sysSettings, setSysSettings] = useState({ cooldownMinutes: 60, coinMultiplier: 1, practiceReward: 0 });

  // 🌟 手機版：底部分頁切換「測驗／商城」，商城內再分「人物／飾品」
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('quiz');
  const [shopCategory, setShopCategory] = useState('base');

  useEffect(() => {
    let unsubUser = () => {};

    const initializeAndListen = async () => {
      // 1. 抓取系統設定
      let currentSettings = { cooldownMinutes: 60, coinMultiplier: 1, practiceReward: 0 };
      const settingsSnap = await getDoc(doc(db, "settings", "system"));
      if (settingsSnap.exists()) {
        currentSettings = { ...currentSettings, ...settingsSnap.data() };
        setSysSettings(currentSettings);
      }

      // 🌟 2. 靈魂融合與前台檢核機制
      try {
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let foundManualAccount = false;
          for (let existingDoc of querySnapshot.docs) {
            if (existingDoc.id !== user.uid) {
              foundManualAccount = true;
              console.log("偵測到雙胞胎帳號，進行金幣與資料轉移...");
              const oldData = existingDoc.data();
              
              await setDoc(doc(db, "users", user.uid), {
                ...oldData,
                name: oldData.name || user.displayName || '未命名學生',
                email: user.email
              });
              
              await deleteDoc(doc(db, "users", existingDoc.id));
              
              alert(`🎉 資料銜接成功！\n已將您設定的金幣成功移轉給「${user.email}」！`);
            }
          }
          
          if (!foundManualAccount) {
            console.log("帳號已綁定完成。");
          }
          
        } else {
          alert(`【系統檢核報告 🚨】\n資料銜接失敗！\n\n這名學生目前是用這個 Email 登入的：\n👉 ${user.email}\n\n但在老師的後台名單中，找不到一模一樣的信箱。\n請回教師控制台核對，是否有拼錯字或打錯網域喔！`);
        }
      } catch (error) {
        alert(`【系統檢核報告 🚨】\n系統嘗試讀取舊資料時被阻擋了！\n\n錯誤原因：${error.message}\n\n💡 這通常是因為 Firebase 的「Firestore 安全規則」限制了學生的搜尋權限。請確認資料庫規則是否開放讀取。`);
        console.error("融合資料失敗：", error);
      }

      // 🌟 3. 啟動即時監聽 (onSnapshot)！
      const userRef = doc(db, "users", user.uid);
      unsubUser = onSnapshot(userRef, async (userSnap) => {
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          let parsedEquipped = { base: 'base_bear', head: null, face: null, accessory: null };
          if (typeof data.equipped === 'object' && data.equipped !== null) {
            parsedEquipped = { ...parsedEquipped, ...data.equipped };
          } else if (data.equippedBase || data.equippedAccessory) {
            parsedEquipped.base = data.equippedBase || 'base_bear';
            parsedEquipped.accessory = data.equippedAccessory || null;
          }

          setUserData({
            ...data,
            name: data.name || user.displayName || '未命名學生',
            coins: data.coins || 0,
            owned_items: data.owned_items || [],
            equipped: parsedEquipped
          });

          if (data.last_quiz_time) {
            const timePassed = new Date().getTime() - new Date(data.last_quiz_time).getTime();
            const cooldownMs = currentSettings.cooldownMinutes * 60 * 1000;
            if (timePassed < cooldownMs) setTimeRemaining(cooldownMs - timePassed);
          }
        } else {
          const defaultData = {
            name: user.displayName || '新同學',
            email: user.email,
            coins: 0,
            owned_items: [],
            equipped: { base: 'base_bear', head: null, face: null, accessory: null },
            created_at: new Date().toISOString()
          };
          await setDoc(userRef, defaultData);
        }
        setIsLoading(false);
      });
    };

    if (user) {
      initializeAndListen();
    }

    return () => {
      unsubUser();
    };
  }, [user]);

  useEffect(() => {
    let timer;
    if (timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 60000)), 60000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  // 🌟 依選擇的科目，抓取老師已建立的單元/課別清單，讓學生可以挑選要考哪個單元
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const q = query(collection(db, "questions"), where("subject", "==", selectedSubject));
        const snap = await getDocs(q);
        const units = new Set();
        snap.forEach(docSnap => units.add(docSnap.data().unit || '未分類'));
        setAvailableUnits([...units].sort());
      } catch (error) {
        console.error("讀取單元清單失敗", error);
        setAvailableUnits([]);
      }
      setSelectedUnit('ALL'); // 🌟 切換科目時重設為綜合測驗
    };
    loadUnits();
  }, [selectedSubject]);

  const handleBuy = async (item) => {
    if (userData.coins < item.price) return alert("⚠️ 金幣不足！");
    if (window.confirm(`確定花費 ${item.price} 購買「${item.name}」？`)) {
      const newCoins = userData.coins - item.price;
      const newOwnedItems = [...userData.owned_items, item.id];
      await setDoc(doc(db, "users", user.uid), { coins: newCoins, owned_items: newOwnedItems }, { merge: true });
    }
  };

  const handleEquip = async (item) => {
    const newEquipped = { ...userData.equipped };
    if (newEquipped[item.type] === item.id) {
      if (item.type !== 'base') newEquipped[item.type] = null; 
    } else {
      newEquipped[item.type] = item.id;
    }
    await setDoc(doc(db, "users", user.uid), { equipped: newEquipped }, { merge: true });
  };

  const handleStartClick = () => {
    onStartQuiz({ subject: selectedSubject, unit: selectedUnit, mode: quizMode, settings: sysSettings });
  };

  if (isLoading || !userData) return <div style={styles.container}><h2>⏳ 載入中...</h2></div>;

  if (showVocabGame) {
    return (
      <div style={styles.container}>
        <Suspense fallback={<GameLoading />}>
          <VocabGame user={user} userData={userData} onBack={() => setShowVocabGame(false)} />
        </Suspense>
      </div>
    );
  }

  if (showMathGame) {
    return (
      <div style={styles.container}>
        <Suspense fallback={<GameLoading />}>
          <MathGame user={user} userData={userData} onBack={() => setShowMathGame(false)} />
        </Suspense>
      </div>
    );
  }

  const equippedBase = SHOP_ITEMS.find(i => i.id === userData.equipped.base);
  const equippedHead = SHOP_ITEMS.find(i => i.id === userData.equipped.head);
  const equippedFace = SHOP_ITEMS.find(i => i.id === userData.equipped.face);
  const equippedAccessory = SHOP_ITEMS.find(i => i.id === userData.equipped.accessory);
  const currentBaseImageUrl = equippedBase ? equippedBase.imageUrl : DEFAULT_BASE_URL;

  // 角色與飾品的商品格子，電腦版兩區都顯示，手機版依小分頁只顯示一區
  const renderShopGrid = (category) => (
    <div style={isMobile ? styles.shopGridMobile : styles.shopGrid}>
      {SHOP_ITEMS.filter(item => (category === 'base' ? item.type === 'base' : item.type !== 'base')).map(item => {
        const isOwned = userData.owned_items.includes(item.id) || (item.type === 'base' && item.price === 0);
        const isEquipped = userData.equipped[item.type] === item.id;
        return (
          <div key={item.id} className="pixel-box" style={isMobile ? styles.itemCardMobile : styles.itemCard}>
            <img src={item.imageUrl} alt={item.name} style={isMobile ? styles.shopItemImageMobile : styles.shopItemImage} />
            <div style={isMobile ? styles.itemNameMobile : styles.itemName}>{item.name}</div>
            {!isOwned ? (
              <button className="pixel-btn btn-yellow" style={styles.buyBtn} onClick={() => handleBuy(item)}>
                <img src={moneyIconImg} alt="money" style={styles.moneyIconSmall} /> {item.price}
              </button>
            ) : (
              <button className={`pixel-btn ${isEquipped ? 'btn-red' : 'btn-green'}`} style={styles.equipBtn} onClick={() => handleEquip(item)}>
                {isEquipped ? (category === 'base' ? "使用中" : "脫下") : "裝備"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const avatarLayers = (
    <>
      <img src={currentBaseImageUrl} alt="base" style={styles.layerImage} />
      {equippedAccessory && <img src={equippedAccessory.imageUrl} alt="accessory" style={styles.layerImage} />}
      {equippedFace && <img src={equippedFace.imageUrl} alt="face" style={styles.layerImage} />}
      {equippedHead && <img src={equippedHead.imageUrl} alt="head" style={styles.layerImage} />}
    </>
  );

  const quizCard = (
    <div className="pixel-card" style={isMobile ? styles.avatarCardMobile : styles.avatarCard}>
      <h3 style={styles.cardTitle}>我的造型</h3>

      <div className="pixel-box floating-base" style={isMobile ? styles.avatarDisplayMobile : styles.avatarDisplay}>
        {avatarLayers}
      </div>

      <div style={styles.quizPanel}>
        <h4>✏️ 選擇測驗科目</h4>
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input type="radio" checked={selectedSubject === '國語'} onChange={() => setSelectedSubject('國語')} /> 國語
          </label>
          <label style={styles.radioLabel}>
            <input type="radio" checked={selectedSubject === '數學'} onChange={() => setSelectedSubject('數學')} /> 數學
          </label>
        </div>

        <h4>📖 選擇單元／課別</h4>
        <div style={{...styles.radioGroup, padding: '10px'}}>
          <select
            style={{padding: '8px', border: '3px solid #4a4a4a', borderRadius: '5px', fontSize: '1.1rem', width: '100%'}}
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="ALL">🔀 綜合測驗（全部單元混合出題）</option>
            {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <h4>🎮 選擇模式</h4>
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input type="radio" checked={quizMode === 'formal'} onChange={() => setQuizMode('formal')} />
            正式測驗 (賺獎勵)
          </label>
          <label style={styles.radioLabel}>
            <input type="radio" checked={quizMode === 'practice'} onChange={() => setQuizMode('practice')} />
            練習模式
            {sysSettings.practiceReward > 0 && <span style={{color: '#8ca279', marginLeft: '5px'}}>(獎勵 {sysSettings.practiceReward} 金幣)</span>}
          </label>
        </div>
      </div>

      <button
        className={`pixel-btn ${quizMode === 'formal' && timeRemaining > 0 ? 'btn-gray' : 'btn-blue'}`}
        style={styles.startBtn}
        disabled={quizMode === 'formal' && timeRemaining > 0}
        onClick={handleStartClick}
      >
        {quizMode === 'formal' && timeRemaining > 0
          ? `⏳ 冷卻中 (${Math.ceil(timeRemaining / 60000)} 分)`
          : '🚀 開始測驗 ➔'}
      </button>

      <button
        className="pixel-btn btn-green"
        style={{...styles.startBtn, marginTop: '15px'}}
        onClick={() => setShowVocabGame(true)}
      >
        📖 進入識字修練場
      </button>

      <button
        className="pixel-btn btn-yellow"
        style={{...styles.startBtn, marginTop: '15px', color: '#4a4a4a'}}
        onClick={() => setShowMathGame(true)}
      >
        ✖️ 九九乘法道場
      </button>
    </div>
  );

  const header = (
    <div style={isMobile ? styles.headerMobile : styles.header}>
      <h2 style={{ color: '#4a4a4a', margin: 0, fontSize: isMobile ? '1.3rem' : undefined, minWidth: 0 }}>
        你好，
        {!isMobile && <br />}
        <span style={{ whiteSpace: 'nowrap' }}>{userData.name}！</span>
      </h2>
      <div className="pixel-btn btn-yellow" style={isMobile ? styles.coinBadgeMobile : styles.coinBadge}>
        <img src={moneyIconImg} alt="money" style={isMobile ? styles.moneyIconSmall : styles.moneyIconLarge} />
        <span>{isMobile ? userData.coins : `目前擁有：${userData.coins}`}</span>
      </div>
    </div>
  );

  // ================= 📱 手機版：測驗／商城 底部分頁 =================
  if (isMobile) {
    return (
      <div style={styles.containerMobile}>
        {header}

        {mobileTab === 'quiz' && quizCard}

        {mobileTab === 'shop' && (
          <div className="pixel-card" style={styles.shopCardMobile}>
            {/* 商城頂端放小預覽，換裝時不用切回測驗分頁就看得到效果 */}
            <div style={styles.shopPreviewRow}>
              <div className="pixel-box" style={styles.avatarPreviewMini}>{avatarLayers}</div>
              <h3 style={{ ...styles.cardTitle, margin: 0, border: 'none', padding: 0, fontSize: '1.5rem' }}>🛍️ 造型商城</h3>
            </div>
            <div style={styles.segmented}>
              <button
                className={`pixel-btn ${shopCategory === 'base' ? 'btn-blue' : 'btn-gray'}`}
                style={styles.segmentBtn}
                onClick={() => setShopCategory('base')}
              >
                🧑‍🤝‍🧑 人物角色
              </button>
              <button
                className={`pixel-btn ${shopCategory === 'accessory' ? 'btn-blue' : 'btn-gray'}`}
                style={styles.segmentBtn}
                onClick={() => setShopCategory('accessory')}
              >
                🎀 飾品配件
              </button>
            </div>
            {renderShopGrid(shopCategory)}
          </div>
        )}

        <nav style={styles.bottomNav}>
          <button
            style={{ ...styles.navBtn, ...(mobileTab === 'quiz' ? styles.navBtnActive : null) }}
            onClick={() => { setMobileTab('quiz'); window.scrollTo(0, 0); }}
          >
            <span style={styles.navIcon}>✏️</span>測驗
          </button>
          <button
            style={{ ...styles.navBtn, ...(mobileTab === 'shop' ? styles.navBtnActive : null) }}
            onClick={() => { setMobileTab('shop'); window.scrollTo(0, 0); }}
          >
            <span style={styles.navIcon}>🛍️</span>商城
          </button>
        </nav>
      </div>
    );
  }

  // ================= 💻 電腦／平板版：左右兩欄 =================
  return (
    <div style={styles.container}>
      {header}

      <div style={styles.mainLayout}>
        {quizCard}

        <div className="pixel-card" style={styles.shopCard}>
          <h3 style={styles.cardTitle}>🛍️ 造型商城</h3>

          <h4 style={styles.sectionTitle}>🧑‍🤝‍🧑 人物角色</h4>
          {renderShopGrid('base')}

          <hr style={styles.divider} />

          <h4 style={styles.sectionTitle}>🎀 飾品配件</h4>
          {renderShopGrid('accessory')}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid #4a4a4a', paddingBottom: '10px' },
  mainLayout: { display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'flex-start' }, 
  avatarCard: { flex: '1', minWidth: '280px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: '20px', height: 'fit-content' },
  shopCard: { flex: '2', minWidth: '320px', padding: '20px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' },
  cardTitle: { color: '#4a4a4a', margin: '0 0 10px 0', fontSize: '1.8rem', borderBottom: '4px dashed #4a4a4a', paddingBottom: '10px' },
  avatarDisplay: { position: 'relative', width: '180px', height: '180px', margin: '15px 0', overflow: 'hidden' },
  layerImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' },
  quizPanel: { width: '100%', textAlign: 'left', marginTop: '15px' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', padding: '10px', border: '4px solid #4a4a4a', backgroundColor: '#e8e8e8' },
  radioLabel: { fontSize: '1.1rem', color: '#4a4a4a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  shopGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' },
  itemCard: { padding: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  shopItemImage: { width: '70px', height: '70px', objectFit: 'contain', marginBottom: '10px' },
  itemName: { fontSize: '1.2rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '10px' },
  sectionTitle: { color: '#4a4a4a', borderLeft: '8px solid #6e85b7', paddingLeft: '10px', marginTop: '20px', marginBottom: '15px', fontSize: '1.4rem' },
  divider: { border: '0', borderTop: '4px dashed #4a4a4a', margin: '25px 0' },
  buyBtn: { width: '100%', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '1.1rem' },
  equipBtn: { width: '100%', padding: '8px', fontSize: '1.1rem' },
  startBtn: { marginTop: '15px', width: '100%', padding: '15px', fontSize: '1.3rem' },
  coinBadge: { padding: '8px 15px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' },
  moneyIconLarge: { height: '28px', objectFit: 'contain' },
  moneyIconSmall: { height: '18px', objectFit: 'contain', verticalAlign: 'middle' },

  // 📱 手機版專用
  containerMobile: { padding: '12px 16px calc(84px + env(safe-area-inset-bottom))', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' },
  headerMobile: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '4px solid #4a4a4a', paddingBottom: '8px' },
  coinBadgeMobile: { padding: '6px 12px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default', flexShrink: 0 },
  avatarCardMobile: { width: '100%', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  avatarDisplayMobile: { position: 'relative', width: '130px', height: '130px', margin: '10px 0', overflow: 'hidden' },
  shopCardMobile: { width: '100%', padding: '16px' },
  shopPreviewRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatarPreviewMini: { position: 'relative', width: '64px', height: '64px', flexShrink: 0, overflow: 'hidden' },
  segmented: { display: 'flex', gap: '10px', marginBottom: '16px' },
  segmentBtn: { flex: 1, minHeight: '44px', padding: '8px', fontSize: '1.05rem' },
  shopGridMobile: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' },
  itemCardMobile: { padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  shopItemImageMobile: { width: '64px', height: '64px', objectFit: 'contain', marginBottom: '6px' },
  itemNameMobile: { fontSize: '1.05rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '8px' },
  bottomNav: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 900, display: 'flex', backgroundColor: '#4a4a4a', borderTop: '4px solid #2c2c2c', paddingBottom: 'env(safe-area-inset-bottom)' },
  navBtn: { flex: 1, minHeight: '64px', border: 'none', background: 'transparent', color: '#dcdfdc', fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' },
  navBtnActive: { backgroundColor: '#d6b75a', color: '#4a4a4a' },
  navIcon: { fontSize: '1.4rem', lineHeight: 1 },
};

export default StudentHome;