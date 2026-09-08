import VocabGame from './VocabGame';
import MathGame from './MathGame';
import React, { useState, useEffect } from 'react';
// 🌟 確保所有需要的 Firebase 功能都有引入
import { doc, getDoc, updateDoc, setDoc, onSnapshot, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import baseBearImg from '../assets/guest_dog_01.png';
import guy from '../assets/maebon3_nureokaki_05.PNG'; 
import hatCapImg from '../assets/uma2.png';
import glassesImg from '../assets/ushi2.png';
import whitehorse from '../assets/thing_whitepegasus_01.PNG';
import luckycatFace from '../assets/event_beckoning-cat_02.PNG'; 
import brave from '../assets/person_brave_01.PNG';
import seaman from '../assets/person_bisyamon_01.PNG';
import bboy from '../assets/person_bboy_03.PNG';
import medalBronzeImg from '../assets/give_baku_01.png';
import moneyIconImg from '../assets/money.png'; 
import beckoningCatImg from '../assets/event_beckoning-cat_02.png';
import presentImg from '../assets/event_present_01.png';
import boiledEggImg from '../assets/food_boiledegg_01.png';
import haniwaImg from '../assets/other_haniwa_01-1.png';
import lanternImg from '../assets/other_izakayalantern_01.png';
import medal1Img from '../assets/other_medal_01.png';
import medal2Img from '../assets/other_medal_02.png';
import medal3Img from '../assets/other_medal_03.png';
import alpacaImg from '../assets/thing_alpaca_03.png';
import dachshund1Img from '../assets/thing_dachshund_01.png';
import dachshund2Img from '../assets/thing_dachshund_02.png';
import monkeyImg from '../assets/thing_monkey_01.png';
import chargespotPersonImg from '../assets/chargespot_person_02.png';
import chargespotStandImg from '../assets/chargespot_stand_01.png';
import hachiImg from '../assets/hachi3.png';
import hitoImg from '../assets/hito.gif';
import kabochaImg from '../assets/kabocha.png';
import maede01Img from '../assets/maede_maedes_01.png';
import maede02Img from '../assets/maede_maedes_02.png';
import maede03Img from '../assets/maede_maedes_03.png';
import maede04Img from '../assets/maede_maedes_04.png';
import maede05Img from '../assets/maede_maedes_05.png';
import maede06Img from '../assets/maede_maedes_06.png';
import maede07Img from '../assets/maede_maedes_07.png';
import maede08Img from '../assets/maede_maedes_08.png';
import maede09Img from '../assets/maede_maedes_09.png';
import maede10Img from '../assets/maede_maedes_10.png';
import maede11Img from '../assets/maede_maedes_11.png';
import avatarBaebonHeart from '../assets/baebon3.png';
import avatarWorker from '../assets/chargespot_person_01.png';
import avatarDiver from '../assets/chargespot_person_03.png';
import avatarPumpkinHero from '../assets/kabocha-new.png';
import avatarIdolFan from '../assets/maebon3_aidoruhikushi.png';
import avatarPicassoFace from '../assets/maebon3_ashida_01.png';
import avatarIceCreamGirl from '../assets/maebon3_chikagugawa_07.png';
import avatarGondolaRider from '../assets/maebon3_gondola1_11.png';
import avatarSuperGorilla from '../assets/maebon3_gorigoriru_25.png';
import avatarPainter from '../assets/maebon3_muttsuri_33.png';
import avatarBenten from '../assets/person_benten_01.png';
import avatarGoddess from '../assets/person_goddess_01.png';
import avatarKappa from '../assets/person_kappa_01.png';
import avatarSwimGirl from '../assets/person_swimsuit_girl_03.png';
import avatarFrogHat from '../assets/person_underwear_froghatman_01.png';
import avatarSailor from '../assets/person_underwear_sailor.png';
import avatarWedding from '../assets/person_wedding_dress_01.png';
import avatarFestival from '../assets/person_yamagasa_01.png';
import avatarRedNinja from '../assets/redhatwithsword.png';

const SHOP_ITEMS = [
  { id: 'base_bear', type: 'base', name: '經典小狗', imageUrl: baseBearImg, price: 0 },
  { id: 'whitehorse', type: 'base', name: '白馬', imageUrl: whitehorse, price: 200 },
  { id: 'guy', type: 'base', name: '小臭臉', imageUrl: guy, price: 150 },
  { id: 'brave', type: 'base', name: '勇士', imageUrl: brave, price: 180 },
  { id: 'seaman', type: 'base', name: '海大王', imageUrl: seaman, price: 160 },
  { id: 'bboy', type: 'base', name: '街頭少年', imageUrl: bboy, price: 170 },
  { id: 'avatar_heart', name: '史萊姆愛心怪', price: 180, imageUrl: avatarBaebonHeart, type: 'base', desc: '看起來壞壞但其實很善良！' },
  { id: 'avatar_pumpkin', name: '南瓜頭勇者', price: 190, imageUrl: avatarPumpkinHero, type: 'base', desc: '萬聖節限定的神秘英雄。' },
  { id: 'avatar_picasso', name: '畢卡索拼圖人', price: 120, imageUrl: avatarPicassoFace, type: 'base', desc: '充滿藝術氣息的抽象臉孔！' },
  { id: 'avatar_gorilla', name: '進擊的大猩猩', price: 150, imageUrl: avatarSuperGorilla, type: 'base', desc: '力大無窮，解題速度加倍(心理作用)！' },
  { id: 'avatar_goddess', name: '智慧女神', price: 150, imageUrl: avatarGoddess, type: 'base', desc: '手持真理之杖，守護著知識的殿堂。' },
  { id: 'avatar_benten', name: '財藝神弁天', price: 160, imageUrl: avatarBenten, type: 'base', desc: '帶來好運與才華的傳說神祇！' },
  { id: 'avatar_kappa', name: '河童小弟', price: 180, imageUrl: avatarKappa, type: 'base', desc: '最喜歡吃小黃瓜，頭頂的盤子不能乾掉喔！' },
  { id: 'avatar_redninja', name: '赤影忍者', price: 250, imageUrl: avatarRedNinja, type: 'base', desc: '身手敏捷，斬斷所有數學難題！' },
  { id: 'avatar_painter', name: '天才老畫家', price: 190, imageUrl: avatarPainter, type: 'base', desc: '用畫筆彩繪出無限的創意。' },
  { id: 'avatar_festival', name: '祭典熱血男', price: 185, imageUrl: avatarFestival, type: 'base', desc: '充滿朝氣，最喜歡熱鬧的節慶！' },
  { id: 'avatar_froghat', name: '青蛙頭套男', price: 170, imageUrl: avatarFrogHat, type: 'base', desc: '雖然穿著內褲，但戴上青蛙帽就很勇敢！' },
  { id: 'avatar_sailor', name: '水手服男孩', price: 175, imageUrl: avatarSailor, type: 'base', desc: '揮舞旗幟，準備向偉大航道出發。' },
  { id: 'avatar_swimgirl', name: '陽光泳裝女孩', price: 180, imageUrl: avatarSwimGirl, type: 'base', desc: '夏天就是要去海邊玩水啊！' },
  { id: 'avatar_wedding', name: '浪漫新娘', price: 200, imageUrl: avatarWedding, type: 'base', desc: '最華麗的純白禮服，商城中的夢幻逸品！' },
  { id: 'avatar_worker', name: '熱血搬運工', price: 160, imageUrl: avatarWorker, type: 'base', desc: '腳踏實地，一步一步賺金幣。' },
  { id: 'avatar_diver', name: '深海潛水員', price: 170, imageUrl: avatarDiver, type: 'base', desc: '準備好潛入知識的海洋了嗎？' },
  { id: 'avatar_idol_fan', name: '熱血追星族', price: 165, imageUrl: avatarIdolFan, type: 'base', desc: '帶著螢光棒為自己加油打氣！' },
  { id: 'avatar_icecream', name: '冰淇淋女孩', price: 175, imageUrl: avatarIceCreamGirl, type: 'base', desc: '答對題目就來口甜甜的冰淇淋吧。' },
  { id: 'avatar_gondola', name: '貢多拉船夫', price: 185, imageUrl: avatarGondolaRider, type: 'base', desc: '帶著寵物一起悠閒地渡河。' },
  { id: 'acc_present', type: 'accessory', name: '驚喜禮物盒', imageUrl: presentImg, price: 30 },
  { id: 'acc_boiled_egg', type: 'accessory', name: '半熟水煮蛋', imageUrl: boiledEggImg, price: 15 },
  { id: 'acc_haniwa', type: 'accessory', name: '復古埴輪', imageUrl: haniwaImg, price: 40 },
  { id: 'acc_lantern', type: 'accessory', name: '居酒屋燈籠', imageUrl: lanternImg, price: 45 },
  { id: 'acc_medal_gold', type: 'accessory', name: '冠軍金牌', imageUrl: medal1Img, price: 100 },
  { id: 'acc_medal_silver', type: 'accessory', name: '亞軍銀牌', imageUrl: medal2Img, price: 80 },
  { id: 'acc_medal_bronze', type: 'accessory', name: '季軍銅牌', imageUrl: medal3Img, price: 60 },
  { id: 'acc_alpaca', type: 'accessory', name: '呆萌羊駝', imageUrl: alpacaImg, price: 70 },
  { id: 'acc_dachshund1', type: 'accessory', name: '棕臘腸', imageUrl: dachshund1Img, price: 55 },
  { id: 'acc_dachshund2', type: 'accessory', name: '黑臘腸', imageUrl: dachshund2Img, price: 55 },
  { id: 'acc_monkey', type: 'accessory', name: '淘氣小猴', imageUrl: monkeyImg, price: 50 },
  { id: 'acc_person_02', name: '科技小人', price: 20, imageUrl: chargespotPersonImg, type: 'accessory' },
  { id: 'acc_stand_01', name: '能量立牌', price: 15, imageUrl: chargespotStandImg, type: 'accessory' },
  { id: 'acc_hachi', name: '萌萌小黃狗', price: 45, imageUrl: hachiImg, type: 'accessory' },
  { id: 'acc_hito', name: '動感火柴人', price: 160, imageUrl: hitoImg, type: 'accessory' },
  { id: 'acc_kabocha', name: '搞怪南瓜', price: 25, imageUrl: kabochaImg, type: 'accessory' },
  { id: 'acc_maede_01', name: '變裝精靈 01', price: 35, imageUrl: maede01Img, type: 'accessory' },
  { id: 'acc_maede_02', name: '變裝精靈 02', price: 35, imageUrl: maede02Img, type: 'accessory' },
  { id: 'acc_maede_03', name: '變裝精靈 03', price: 35, imageUrl: maede03Img, type: 'accessory' },
  { id: 'acc_maede_04', name: '變裝精靈 04', price: 35, imageUrl: maede04Img, type: 'accessory' },
  { id: 'acc_maede_05', name: '變裝精靈 05', price: 35, imageUrl: maede05Img, type: 'accessory' },
  { id: 'acc_maede_06', name: '變裝精靈 06', price: 35, imageUrl: maede06Img, type: 'accessory' },
  { id: 'acc_maede_07', name: '變裝精靈 07', price: 35, imageUrl: maede07Img, type: 'accessory' },
  { id: 'acc_maede_08', name: '變裝精靈 08', price: 35, imageUrl: maede08Img, type: 'accessory' },
  { id: 'acc_maede_09', name: '變裝精靈 09', price: 35, imageUrl: maede09Img, type: 'accessory' },
  { id: 'acc_maede_10', name: '變裝精靈 10', price: 35, imageUrl: maede10Img, type: 'accessory' },
  { id: 'acc_maede_11', name: '變裝精靈 11', price: 35, imageUrl: maede11Img, type: 'accessory' },
];

const DEFAULT_BASE_URL = baseBearImg;

const StudentHome = ({ user, onStartQuiz }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVocabGame, setShowVocabGame] = useState(false);
  const [showMathGame, setShowMathGame] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState('國語');
  const [quizMode, setQuizMode] = useState('formal'); 
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sysSettings, setSysSettings] = useState({ cooldownMinutes: 60, coinMultiplier: 1, practiceReward: 0 });

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
    onStartQuiz({ subject: selectedSubject, mode: quizMode, settings: sysSettings });
  };

  if (isLoading || !userData) return <div style={styles.container}><h2>⏳ 載入中...</h2></div>;

  if (showVocabGame) {
    return (
      <div style={styles.container}>
        <VocabGame user={user} userData={userData} onBack={() => setShowVocabGame(false)} />
      </div>
    );
  }

  if (showMathGame) {
    return (
      <div style={styles.container}>
        <MathGame user={user} userData={userData} onBack={() => setShowMathGame(false)} />
      </div>
    );
  }

  const equippedBase = SHOP_ITEMS.find(i => i.id === userData.equipped.base);
  const equippedHead = SHOP_ITEMS.find(i => i.id === userData.equipped.head);
  const equippedFace = SHOP_ITEMS.find(i => i.id === userData.equipped.face);
  const equippedAccessory = SHOP_ITEMS.find(i => i.id === userData.equipped.accessory);
  const currentBaseImageUrl = equippedBase ? equippedBase.imageUrl : DEFAULT_BASE_URL;

  return (
    <div style={styles.container}>
      {/* 🌟 CSS 魔法區：當畫面小於 768px (手機) 時，隱藏商城並讓卡片滿版 */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-hide { display: none !important; }
          .mobile-full { 
            width: 100% !important; 
            min-width: 100% !important; 
            flex: none !important;
            position: relative !important; 
          }
        }
      `}</style>

      <div style={styles.header}>
        <h2 style={{ color: '#4a4a4a' }}>你好，{userData.name}！</h2>
        <div className="pixel-btn btn-yellow" style={styles.coinBadge}>
          <img src={moneyIconImg} alt="money" style={styles.moneyIconLarge} /> 
          <span>目前擁有：{userData.coins}</span>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* 🌟 加入 mobile-full，手機版撐滿版面 */}
        <div className="pixel-card mobile-full" style={styles.avatarCard}>
          <h3 style={styles.cardTitle}>我的造型</h3>
          
          <div className="pixel-box floating-base" style={styles.avatarDisplay}>
            <img src={currentBaseImageUrl} alt="base" style={styles.layerImage} />
            {equippedAccessory && <img src={equippedAccessory.imageUrl} alt="accessory" style={styles.layerImage} />}
            {equippedFace && <img src={equippedFace.imageUrl} alt="face" style={styles.layerImage} />}
            {equippedHead && <img src={equippedHead.imageUrl} alt="head" style={styles.layerImage} />}
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

        {/* 🌟 加入 mobile-hide，手機版隱藏商城 */}
        <div className="pixel-card mobile-hide" style={styles.shopCard}>
          <h3 style={styles.cardTitle}>🛍️ 造型商城</h3>
          
          <h4 style={styles.sectionTitle}>🧑‍🤝‍🧑 人物角色</h4>
          <div style={styles.shopGrid}>
            {SHOP_ITEMS.filter(item => item.type === 'base').map(item => {
              const isOwned = userData.owned_items.includes(item.id) || item.price === 0;
              const isEquipped = userData.equipped.base === item.id;
              return (
                <div key={item.id} className="pixel-box" style={styles.itemCard}>
                  <img src={item.imageUrl} alt={item.name} style={styles.shopItemImage} />
                  <div style={styles.itemName}>{item.name}</div>
                  {!isOwned ? (
                    <button className="pixel-btn btn-yellow" style={styles.buyBtn} onClick={() => handleBuy(item)}>
                      <img src={moneyIconImg} alt="money" style={styles.moneyIconSmall} /> {item.price}
                    </button>
                  ) : (
                    <button className={`pixel-btn ${isEquipped ? 'btn-red' : 'btn-green'}`} style={styles.equipBtn} onClick={() => handleEquip(item)}>
                      {isEquipped ? "使用中" : "裝備"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <hr style={styles.divider} />

          <h4 style={styles.sectionTitle}>🎀 飾品配件</h4>
          <div style={styles.shopGrid}>
            {SHOP_ITEMS.filter(item => item.type !== 'base').map(item => {
              const isOwned = userData.owned_items.includes(item.id);
              const isEquipped = userData.equipped[item.type] === item.id;
              return (
                <div key={item.id} className="pixel-box" style={styles.itemCard}>
                  <img src={item.imageUrl} alt={item.name} style={styles.shopItemImage} />
                  <div style={styles.itemName}>{item.name}</div>
                  {!isOwned ? (
                    <button className="pixel-btn btn-yellow" style={styles.buyBtn} onClick={() => handleBuy(item)}>
                      <img src={moneyIconImg} alt="money" style={styles.moneyIconSmall} /> {item.price}
                    </button>
                  ) : (
                    <button className={`pixel-btn ${isEquipped ? 'btn-red' : 'btn-green'}`} style={styles.equipBtn} onClick={() => handleEquip(item)}>
                      {isEquipped ? "脫下" : "裝備"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
};

export default StudentHome;