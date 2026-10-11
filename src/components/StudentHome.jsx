import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';

// 🌟 遊戲點進去才下載，學生主頁先快速顯示
const VocabGame = lazy(() => import('./VocabGame'));
const MathGame = lazy(() => import('./MathGame'));
const GameLoading = () => <h2 style={{ textAlign: 'center', color: '#4a4a4a' }}>⏳ 遊戲載入中...</h2>;
// 🌟 確保所有需要的 Firebase 功能都有引入
import { doc, getDoc, updateDoc, setDoc, onSnapshot, query, collection, where, getDocs, deleteDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_ITEMS, DEFAULT_BASE_URL, moneyIconImg } from '../data/shopItems';
import { useIsMobile } from '../hooks/useIsMobile';
import PixelDialog from './PixelDialog';

const StudentHome = ({ user, onStartQuiz, initialTab = 'quiz' }) => {
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
  const [mobileTab, setMobileTab] = useState(initialTab);
  const [shopCategory, setShopCategory] = useState('base');

  // 🌟 商城互動：像素購買對話框、買完的提示與角色跳一下
  const [buyTarget, setBuyTarget] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const [toast, setToast] = useState(null);
  const [hopKey, setHopKey] = useState(0);
  const [hopping, setHopping] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const triggerHop = () => { setHopKey(k => k + 1); setHopping(true); };
  const onHopEnd = (e) => { if (e.animationName === 'avatar-hop') setHopping(false); };
  const toastTimer = useRef(null);
  const shopCardRef = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // 🌟 桌機版從結算頁按「去商城」回來時，等資料載入後直接捲到商城區
  useEffect(() => {
    if (!isLoading && initialTab === 'shop' && !isMobile) {
      shopCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, initialTab, isMobile]);

  // 🌟 登入檢核的訊息改成畫面上的像素提示卡，不再跳出技術性的 alert
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let unsubUser = () => {};

    const initializeAndListen = async () => {
      // 1. 抓取系統設定
      let currentSettings = { cooldownMinutes: 60, coinMultiplier: 1, practiceReward: 0 };
      // 讀不到系統設定就用預設值繼續，不要讓畫面卡在「載入中」
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "system"));
        if (settingsSnap.exists()) {
          currentSettings = { ...currentSettings, ...settingsSnap.data() };
          setSysSettings(currentSettings);
        }
      } catch (error) {
        console.error("讀取系統設定失敗，改用預設值", error);
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
              
              setNotice({ tone: 'good', text: '🎉 你的金幣和造型都已經接上這個帳號囉！' });
            }
          }
          
          if (!foundManualAccount) {
            console.log("帳號已綁定完成。");
          }
          
        } else {
          // 給老師的技術細節留在 console，學生只看到該怎麼做
          console.warn(`資料銜接失敗：後台名單找不到 ${user.email}，請回教師控制台核對信箱是否拼錯。`);
          setNotice({ tone: 'warn', text: `請告訴老師：你的帳號（${user.email}）還沒加入班級名單，金幣可能不會被記錄。` });
        }
      } catch (error) {
        // 通常是 Firestore 安全規則限制了學生的搜尋權限，細節留在 console 給老師查
        console.error("融合資料失敗（請確認 Firestore 安全規則是否開放讀取）：", error);
        setNotice({ tone: 'warn', text: '😅 讀取資料時卡住了，請重新整理一次；如果還是不行，請告訴老師。' });
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
        // 依數字大小排序，「第2課」才會排在「第10課」前面
        setAvailableUnits([...units].sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true })));
      } catch (error) {
        console.error("讀取單元清單失敗", error);
        setAvailableUnits([]);
      }
      setSelectedUnit('ALL'); // 🌟 切換科目時重設為綜合測驗
    };
    loadUnits();
  }, [selectedSubject]);

  const showToast = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const closeBuyDialog = () => {
    if (isBuying) return;
    setBuyTarget(null);
    setBuyError(null);
  };

  // 🌟 買下後直接幫學生穿上，並讓角色跳一下
  // 用 transaction 以資料庫裡「當下」的餘額計算，不會用畫面上的舊數字覆蓋掉別台裝置的變動
  const confirmBuy = async () => {
    const item = buyTarget;
    if (!item || isBuying) return;
    setIsBuying(true);
    setBuyError(null);
    const userRef = doc(db, "users", user.uid);
    const purchase = runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.data() || {};
      const coins = data.coins || 0;
      if ((data.owned_items || []).includes(item.id)) throw new Error('owned');
      if (coins < item.price) throw new Error('not-enough');
      const currentEquipped = (typeof data.equipped === 'object' && data.equipped !== null)
        ? data.equipped
        : { base: data.equippedBase || 'base_bear', head: null, face: null, accessory: data.equippedAccessory || null };
      tx.update(userRef, {
        coins: coins - item.price,
        owned_items: arrayUnion(item.id),
        equipped: { ...currentEquipped, [item.type]: item.id },
      });
    });
    // 網路斷掉時 Firestore 可能一直等不到回應，8 秒後先放開按鈕，讓孩子可以關掉對話框
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
    try {
      await Promise.race([purchase, timeout]);
      setBuyTarget(null);
      triggerHop();
      showToast(`🎉 買到「${item.name}」，已經幫你穿上囉！`);
    } catch (error) {
      console.error("購買失敗", error);
      setBuyError(
        error.message === 'not-enough' ? '😅 金幣不夠喔，可能剛剛在別的地方花掉了。'
        : error.message === 'owned' ? '你已經有這個囉！可以直接穿上。'
        : error.message === 'timeout' ? '📶 網路好像不太穩，請等一下再試。如果金幣已經扣掉，東西也會出現在你的商城裡。'
        : '😅 購買沒有成功，金幣沒有被扣，請再試一次。'
      );
    }
    setIsBuying(false);
  };

  const handleEquip = async (item) => {
    const newEquipped = { ...userData.equipped };
    if (newEquipped[item.type] === item.id) {
      if (item.type !== 'base') newEquipped[item.type] = null; 
    } else {
      newEquipped[item.type] = item.id;
    }
    await setDoc(doc(db, "users", user.uid), { equipped: newEquipped }, { merge: true });
    triggerHop();
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

  const isCoolingDown = quizMode === 'formal' && timeRemaining > 0;
  const formalReward = Math.max(1, Math.round(10 * (sysSettings.coinMultiplier || 1)));

  // 商品排序：買得起的放最前面，再來是已經有的，最後是還差一點的（各自依價格由低到高）
  const shopRank = (item) => {
    const owned = userData.owned_items.includes(item.id) || (item.type === 'base' && item.price === 0);
    if (owned) return 1;
    return item.price <= userData.coins ? 0 : 2;
  };
  const cooldownMinutes = Math.ceil(timeRemaining / 60000);

  // 角色與飾品的商品格子，電腦版兩區都顯示，手機版依小分頁只顯示一區
  const renderShopGrid = (category) => (
    <div style={isMobile ? styles.shopGridMobile : styles.shopGrid}>
      {SHOP_ITEMS
        .filter(item => (category === 'base' ? item.type === 'base' : item.type !== 'base'))
        .sort((a, b) => shopRank(a) - shopRank(b) || a.price - b.price)
        .map(item => {
        const isOwned = userData.owned_items.includes(item.id) || (item.type === 'base' && item.price === 0);
        const isEquipped = userData.equipped[item.type] === item.id;
        const shortfall = item.price - userData.coins;
        return (
          <div
            key={item.id}
            className="pixel-box"
            style={{
              ...(isMobile ? styles.itemCardMobile : styles.itemCard),
              ...(isEquipped ? styles.itemCardEquipped : null),
              ...(!isOwned && shortfall > 0 ? styles.itemCardLocked : null),
            }}
          >
            {isEquipped && <span style={styles.wearingTag}>✔ 穿著</span>}
            <img src={item.imageUrl} alt={item.name} style={isMobile ? styles.shopItemImageMobile : styles.shopItemImage} />
            <div style={isMobile ? styles.itemNameMobile : styles.itemName}>{item.name}</div>
            {!isOwned ? (
              shortfall > 0 ? (
                // 買不起也能點開試穿，看看穿上的樣子、還要考幾次
                <button className="pixel-btn btn-ghost" style={styles.shortfall} onClick={() => setBuyTarget(item)}>
                  <span><img src={moneyIconImg} alt="金幣" style={styles.moneyIconSmall} /> {item.price}</span>
                  <span style={styles.shortfallNote}>還差 {shortfall}・試穿</span>
                </button>
              ) : (
                <button className="pixel-btn btn-yellow" style={styles.buyBtn} onClick={() => setBuyTarget(item)}>
                  <img src={moneyIconImg} alt="金幣" style={styles.moneyIconSmall} /> {item.price}
                </button>
              )
            ) : isEquipped ? (
              item.type === 'base' ? (
                <div style={styles.equippedTag}>正在使用</div>
              ) : (
                <button className="pixel-btn btn-ghost" style={styles.equipBtn} onClick={() => handleEquip(item)}>脫下</button>
              )
            ) : (
              <button className="pixel-btn btn-green" style={styles.equipBtn} onClick={() => handleEquip(item)}>穿上</button>
            )}
          </div>
        );
      })}
    </div>
  );

  // 疊圖：可以傳入「試穿」的商品，購買對話框用來預覽穿上的樣子
  const renderAvatarLayers = (tryOn) => {
    const base = tryOn?.type === 'base' ? tryOn : equippedBase;
    const accessory = tryOn && tryOn.type === 'accessory' ? tryOn : equippedAccessory;
    return (
      <>
        <img src={base ? base.imageUrl : DEFAULT_BASE_URL} alt="" style={styles.layerImage} />
        {accessory && <img src={accessory.imageUrl} alt="" style={styles.layerImage} />}
        {equippedFace && <img src={equippedFace.imageUrl} alt="" style={styles.layerImage} />}
        {equippedHead && <img src={equippedHead.imageUrl} alt="" style={styles.layerImage} />}
      </>
    );
  };

  // 像素切換塊：取代原生的小圓點選項，手指好點
  const renderToggle = (label, options, value, onChange) => (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{label}</legend>
      <div style={styles.toggleRow}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`pixel-btn btn-paper ${value === opt.value ? 'is-pressed' : ''}`}
            style={styles.toggleBtn}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            <span>{opt.label}</span>
            {opt.note && <small style={styles.toggleNote}>{opt.note}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );

  const quizCard = (
    <div className="pixel-card" style={isMobile ? styles.avatarCardMobile : styles.avatarCard}>
      {!isMobile && (
        <>
          <h3 style={styles.cardTitle}>我的造型</h3>
          <div key={hopKey} className={`pixel-box ${hopping ? 'avatar-hop' : 'floating-avatar'}`} style={styles.avatarDisplay} onAnimationEnd={onHopEnd}>
            {renderAvatarLayers()}
          </div>
        </>
      )}

      <div style={styles.quizPanel}>
        {renderToggle('✏️ 科目', [{ value: '國語', label: '國語' }, { value: '數學', label: '數學' }], selectedSubject, setSelectedSubject)}

        <label style={styles.fieldset}>
          <span style={styles.legend}>📖 單元</span>
          <select className="pixel-select" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
            <option value="ALL">🔀 全部單元混合</option>
            {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        {renderToggle('🎮 模式', [
          { value: 'formal', label: '正式測驗', note: '賺金幣' },
          { value: 'practice', label: '練習', note: sysSettings.practiceReward > 0 ? `+${sysSettings.practiceReward} 金幣` : '隨時可玩' },
        ], quizMode, setQuizMode)}
      </div>

      <button
        className="pixel-btn btn-blue"
        style={styles.startBtn}
        disabled={isCoolingDown}
        onClick={handleStartClick}
      >
        {isCoolingDown ? `⏳ 正式測驗休息中（${cooldownMinutes} 分）` : '🚀 開始測驗'}
      </button>
      {isCoolingDown && (
        <div style={styles.cooldownHint}>
          <p style={{ margin: '0 0 10px' }}>正式測驗每 {sysSettings.cooldownMinutes} 分鐘可以考一次。休息的時候，可以先玩練習或修練場！</p>
          <button type="button" className="pixel-btn btn-paper" style={styles.practiceBtn} onClick={() => setQuizMode('practice')}>🎮 改玩練習模式</button>
        </div>
      )}

      {/* 兩個小遊戲是次要入口：並排的小卡，不跟「開始測驗」搶 */}
      <div style={styles.gameRow}>
        <button className="pixel-btn btn-green" style={styles.gameBtn} onClick={() => setShowVocabGame(true)}>
          <span style={styles.gameIcon}>📖</span>識字修練場
        </button>
        <button className="pixel-btn btn-yellow" style={styles.gameBtn} onClick={() => setShowMathGame(true)}>
          <span style={styles.gameIcon}>✖️</span>九九乘法道場
        </button>
      </div>
    </div>
  );

  const header = (
    <div style={isMobile ? styles.headerMobile : styles.header}>
      {isMobile && (
        <div key={hopKey} className={`pixel-box ${hopping ? 'avatar-hop' : ''}`} style={styles.avatarMini} onAnimationEnd={onHopEnd}>
          {renderAvatarLayers()}
        </div>
      )}
      <h2 style={{ color: '#4a4a4a', margin: 0, fontSize: isMobile ? '1.3rem' : undefined, minWidth: 0, flex: isMobile ? 1 : undefined }}>
        你好，
        {!isMobile && <br />}
        <span style={isMobile ? styles.nameMobile : { whiteSpace: 'nowrap' }}>{userData.name}！</span>
      </h2>
      <div className="pixel-badge" style={isMobile ? styles.coinBadgeMobile : styles.coinBadge} aria-label={`目前有 ${userData.coins} 金幣`}>
        <img src={moneyIconImg} alt="" style={isMobile ? styles.moneyIconSmall : styles.moneyIconLarge} />
        <span>{isMobile ? userData.coins : `目前擁有：${userData.coins}`}</span>
      </div>
    </div>
  );

  const noticeCard = notice && (
    <div className="pixel-box" role="status" style={{ ...styles.notice, backgroundColor: notice.tone === 'good' ? '#e6ecdf' : '#fdf6e3' }}>
      <span style={{ flex: 1 }}>{notice.text}</span>
      <button className="pixel-btn btn-ghost" style={styles.noticeClose} onClick={() => setNotice(null)} aria-label="關閉提示">✕</button>
    </div>
  );

  const accessoryHint = (
    <p style={styles.shopHint}>🎀 一次只能戴一個飾品，穿上新的會自動換掉舊的。</p>
  );

  const buyShortfall = buyTarget ? buyTarget.price - userData.coins : 0;
  const buyDialog = buyTarget && (
    <PixelDialog
      title={buyShortfall > 0 ? `試穿「${buyTarget.name}」` : `要買「${buyTarget.name}」嗎？`}
      onClose={closeBuyDialog}
      actions={buyShortfall > 0 ? (
        <button className="pixel-btn btn-blue" style={styles.dialogBtn} onClick={closeBuyDialog}>知道了，去賺金幣！</button>
      ) : (<>
        <button className="pixel-btn btn-yellow" style={styles.dialogBtn} onClick={confirmBuy} disabled={isBuying}>
          {isBuying ? '⏳ 購買中…' : '買下並穿上'}
        </button>
        <button className="pixel-btn btn-ghost" style={styles.dialogBtn} onClick={closeBuyDialog} disabled={isBuying} data-autofocus>再想想</button>
      </>)}
    >
      <div className="pixel-box" style={styles.tryOnBox}>{renderAvatarLayers(buyTarget)}</div>
      {buyTarget.desc && <p style={{ margin: '0 0 10px' }}>{buyTarget.desc}</p>}
      {buyShortfall > 0 ? (
        <div style={styles.priceMath}>
          還差 <img src={moneyIconImg} alt="金幣" style={styles.moneyIconSmall} /> <strong>{buyShortfall}</strong>
          <div style={{ fontSize: '1.05rem', marginTop: '6px' }}>大約再考 {Math.ceil(buyShortfall / formalReward)} 次正式測驗就買得到！</div>
        </div>
      ) : (
        <div style={styles.priceMath}>
          <img src={moneyIconImg} alt="金幣" style={styles.moneyIconSmall} /> {userData.coins}
          <span> − {buyTarget.price} → </span>
          <strong>剩 {userData.coins - buyTarget.price}</strong>
        </div>
      )}
      {buyShortfall <= 0 && buyTarget.type === 'accessory' && equippedAccessory && (
        <p style={{ margin: '10px 0 0', fontSize: '1rem' }}>會換掉你現在戴的「{equippedAccessory.name}」</p>
      )}
      {buyError && <div className="pixel-box" role="alert" style={styles.dialogError}>{buyError}</div>}
    </PixelDialog>
  );

  const toastEl = toast && (
    <div className="pixel-badge pixel-dialog" role="status" style={{ ...styles.toast, bottom: isMobile ? 'calc(84px + env(safe-area-inset-bottom))' : '40px' }}>
      {toast}
    </div>
  );

  // ================= 📱 手機版：測驗／商城 底部分頁 =================
  if (isMobile) {
    return (
      <div style={styles.containerMobile}>
        {mobileTab === 'quiz' && header}
        {noticeCard}

        {mobileTab === 'quiz' && quizCard}

        {mobileTab === 'shop' && (
          <div className="pixel-card" style={styles.shopCardMobile}>
            {/* 角色和金幣黏在商城頂端：捲到哪裡都看得到換裝結果 */}
            <div style={styles.shopStrip}>
              <div key={hopKey} className={`pixel-box ${hopping ? 'avatar-hop' : ''}`} style={styles.avatarStrip} onAnimationEnd={onHopEnd}>
                {renderAvatarLayers()}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', flex: 1 }}>🛍️ 造型商城</h3>
              <div className="pixel-badge" style={styles.coinBadgeMobile} aria-label={`目前有 ${userData.coins} 金幣`}>
                <img src={moneyIconImg} alt="" style={styles.moneyIconSmall} />
                <span>{userData.coins}</span>
              </div>
            </div>
            <div style={styles.segmented}>
              <button
                className={`pixel-btn btn-paper ${shopCategory === 'base' ? 'is-pressed' : ''}`}
                style={styles.segmentBtn}
                aria-pressed={shopCategory === 'base'}
                onClick={() => setShopCategory('base')}
              >
                🧑‍🤝‍🧑 人物角色
              </button>
              <button
                className={`pixel-btn btn-paper ${shopCategory === 'accessory' ? 'is-pressed' : ''}`}
                style={styles.segmentBtn}
                aria-pressed={shopCategory === 'accessory'}
                onClick={() => setShopCategory('accessory')}
              >
                🎀 飾品配件
              </button>
            </div>
            {shopCategory === 'accessory' && accessoryHint}
            {renderShopGrid(shopCategory)}
          </div>
        )}

        <nav style={styles.bottomNav} aria-label="主選單">
          <button
            className="nav-btn"
            style={{ ...styles.navBtn, ...(mobileTab === 'quiz' ? styles.navBtnActive : null) }}
            aria-current={mobileTab === 'quiz' ? 'page' : undefined}
            onClick={() => { setMobileTab('quiz'); window.scrollTo(0, 0); }}
          >
            <span style={styles.navIcon}>✏️</span>測驗
          </button>
          <button
            className="nav-btn"
            style={{ ...styles.navBtn, ...(mobileTab === 'shop' ? styles.navBtnActive : null) }}
            aria-current={mobileTab === 'shop' ? 'page' : undefined}
            onClick={() => { setMobileTab('shop'); window.scrollTo(0, 0); }}
          >
            <span style={styles.navIcon}>🛍️</span>商城
          </button>
        </nav>

        {buyDialog}
        {toastEl}
      </div>
    );
  }

  // ================= 💻 電腦／平板版：左右兩欄 =================
  return (
    <div style={styles.container}>
      {header}
      {noticeCard}

      <div style={styles.mainLayout}>
        {quizCard}

        <div ref={shopCardRef} className="pixel-card" style={{ ...styles.shopCard, scrollMarginTop: '72px' }}>
          <h3 style={styles.cardTitle}>🛍️ 造型商城</h3>

          <h4 style={styles.sectionTitle}><span className="pixel-tag">🧑‍🤝‍🧑 人物角色</span></h4>
          {renderShopGrid('base')}

          <hr style={styles.divider} />

          <h4 style={styles.sectionTitle}><span className="pixel-tag">🎀 飾品配件</span></h4>
          {accessoryHint}
          {renderShopGrid('accessory')}
        </div>
      </div>

      {buyDialog}
      {toastEl}
    </div>
  );
};

const styles = {
  container: { maxWidth: '980px', margin: '0 auto', padding: '20px', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', color: '#4a4a4a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid #4a4a4a', paddingBottom: '10px' },
  mainLayout: { display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'flex-start' },
  // 左欄跟著頁面捲動停在頂列下方；商城不再做內部捲動，平板上才不會捲動區套捲動區
  avatarCard: { flex: '1', minWidth: '280px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: '72px', height: 'fit-content' },
  shopCard: { flex: '2', minWidth: '320px', padding: '20px' },
  cardTitle: { color: '#4a4a4a', margin: '0 0 10px 0', fontSize: '1.8rem', borderBottom: '4px dashed #4a4a4a', paddingBottom: '10px' },
  avatarDisplay: { position: 'relative', width: '160px', height: '160px', margin: '12px 0', overflow: 'hidden' },
  layerImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' },
  quizPanel: { width: '100%', textAlign: 'left', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldset: { display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', margin: 0, padding: 0, minWidth: 0 },
  legend: { fontSize: '1.15rem', fontWeight: 'bold', padding: 0, marginBottom: '8px' },
  toggleRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingRight: '4px' },
  toggleBtn: { minHeight: '56px', padding: '8px', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' },
  toggleNote: { fontSize: '0.85rem', fontWeight: 'bold' },
  startBtn: { marginTop: '18px', width: '100%', minHeight: '60px', padding: '14px', fontSize: '1.45rem' },
  cooldownHint: { marginTop: '12px', fontSize: '1.05rem', lineHeight: 1.5, textAlign: 'left', width: '100%', paddingRight: '4px' },
  practiceBtn: { width: '100%', minHeight: '48px', fontSize: '1.1rem' },
  nameMobile: { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dialogError: { marginTop: '14px', padding: '10px 12px', backgroundColor: '#fdf6e3', fontSize: '1.05rem', textAlign: 'left' },
  shopStrip: { position: 'sticky', top: '64px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', margin: '-16px -16px 14px', padding: '10px 16px', backgroundColor: '#f2efeb', borderBottom: '4px dashed #4a4a4a' },
  avatarStrip: { position: 'relative', width: '80px', height: '80px', flexShrink: 0, overflow: 'hidden', backgroundColor: '#dcdfdc' },
  gameRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', marginTop: '18px', paddingRight: '4px' },
  gameBtn: { minHeight: '64px', padding: '8px', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 1.2 },
  gameIcon: { fontSize: '1.4rem' },
  shopGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' },
  itemCard: { position: 'relative', padding: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  itemCardEquipped: { backgroundColor: '#fdf6e3' },
  itemCardLocked: { borderStyle: 'dashed', backgroundColor: '#ecebe7' },
  shopItemImage: { width: '70px', height: '70px', objectFit: 'contain', marginBottom: '10px' },
  itemName: { fontSize: '1.2rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '10px' },
  sectionTitle: { margin: '20px 0 15px', fontSize: '1.3rem' },
  divider: { border: '0', borderTop: '4px dashed #4a4a4a', margin: '25px 0' },
  buyBtn: { width: '100%', minHeight: '44px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '1.1rem' },
  equipBtn: { width: '100%', minHeight: '44px', padding: '8px', fontSize: '1.05rem' },
  equippedTag: { width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.05rem', border: '4px dashed #4a4a4a' },
  wearingTag: { position: 'absolute', top: 0, left: 0, padding: '2px 8px', backgroundColor: '#4a4a4a', color: '#f2efeb', fontSize: '0.9rem', fontWeight: 'bold' },
  shortfall: { width: '100%', minHeight: '48px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', fontSize: '1rem', lineHeight: 1.2 },
  shortfallNote: { fontSize: '0.9rem' },
  shopHint: { margin: '0 0 14px', fontSize: '1.05rem', lineHeight: 1.5 },
  coinBadge: { padding: '8px 15px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' },
  moneyIconLarge: { height: '28px', objectFit: 'contain' },
  moneyIconSmall: { height: '18px', objectFit: 'contain', verticalAlign: 'middle' },
  notice: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', marginBottom: '16px', fontSize: '1.1rem', lineHeight: 1.5 },
  noticeClose: { minWidth: '44px', minHeight: '44px', padding: 0, fontSize: '1rem', flexShrink: 0 },
  dialogBtn: { width: '100%', minHeight: '52px', fontSize: '1.2rem' },
  tryOnBox: { position: 'relative', width: '140px', height: '140px', margin: '0 auto 12px', overflow: 'hidden' },
  priceMath: { fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' },
  toast: { position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 3100, padding: '10px 18px', fontSize: '1.1rem', width: 'max-content', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' },

  // 📱 手機版專用
  containerMobile: { padding: '12px 16px calc(84px + env(safe-area-inset-bottom))', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif', color: '#4a4a4a' },
  headerMobile: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '4px solid #4a4a4a', paddingBottom: '8px' },
  avatarMini: { position: 'relative', width: '56px', height: '56px', flexShrink: 0, overflow: 'hidden' },
  coinBadgeMobile: { padding: '6px 12px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  avatarCardMobile: { width: '100%', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  shopCardMobile: { width: '100%', padding: '16px' },
  segmented: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', paddingRight: '4px' },
  segmentBtn: { minHeight: '48px', padding: '8px', fontSize: '1.05rem' },
  shopGridMobile: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' },
  itemCardMobile: { position: 'relative', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  shopItemImageMobile: { width: '64px', height: '64px', objectFit: 'contain', marginBottom: '6px' },
  itemNameMobile: { fontSize: '1.05rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '8px' },
  bottomNav: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 900, display: 'flex', backgroundColor: '#4a4a4a', borderTop: '4px solid #2c2c2c', paddingBottom: 'env(safe-area-inset-bottom)' },
  navBtn: { flex: 1, minHeight: '64px', border: 'none', background: 'transparent', color: '#f2efeb', fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' },
  navBtnActive: { backgroundColor: '#d6b75a', color: '#4a4a4a' },
  navIcon: { fontSize: '1.4rem', lineHeight: 1 },
};

export default StudentHome;