import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// =========================================================================
// 🌟 1. 圖片資源匯入 (必須與教師端完全一致！)
// =========================================================================
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
  { id: 'avatar_heart', name: '史萊姆愛心怪', price: 80, imageUrl: avatarBaebonHeart, type: 'base' },
  { id: 'avatar_pumpkin', name: '南瓜頭勇者', price: 90, imageUrl: avatarPumpkinHero, type: 'base' },
  { id: 'avatar_picasso', name: '畢卡索拼圖人', price: 120, imageUrl: avatarPicassoFace, type: 'base' },
  { id: 'avatar_gorilla', name: '進擊的大猩猩', price: 150, imageUrl: avatarSuperGorilla, type: 'base' },
  { id: 'avatar_goddess', name: '智慧女神', price: 150, imageUrl: avatarGoddess, type: 'base' },
  { id: 'avatar_benten', name: '財藝神弁天', price: 160, imageUrl: avatarBenten, type: 'base' },
  { id: 'avatar_kappa', name: '河童小弟', price: 80, imageUrl: avatarKappa, type: 'base' },
  { id: 'avatar_redninja', name: '赤影忍者', price: 120, imageUrl: avatarRedNinja, type: 'base' },
  { id: 'avatar_painter', name: '天才老畫家', price: 90, imageUrl: avatarPainter, type: 'base' },
  { id: 'avatar_festival', name: '祭典熱血男', price: 85, imageUrl: avatarFestival, type: 'base' },
  { id: 'avatar_froghat', name: '青蛙頭套男', price: 70, imageUrl: avatarFrogHat, type: 'base' },
  { id: 'avatar_sailor', name: '水手服男孩', price: 75, imageUrl: avatarSailor, type: 'base' },
  { id: 'avatar_swimgirl', name: '陽光泳裝女孩', price: 80, imageUrl: avatarSwimGirl, type: 'base' },
  { id: 'avatar_wedding', name: '浪漫新娘', price: 200, imageUrl: avatarWedding, type: 'base' },
  { id: 'avatar_worker', name: '熱血搬運工', price: 60, imageUrl: avatarWorker, type: 'base' },
  { id: 'avatar_diver', name: '深海潛水員', price: 70, imageUrl: avatarDiver, type: 'base' },
  { id: 'avatar_idol_fan', name: '熱血追星族', price: 65, imageUrl: avatarIdolFan, type: 'base' },
  { id: 'avatar_icecream', name: '冰淇淋女孩', price: 75, imageUrl: avatarIceCreamGirl, type: 'base' },
  { id: 'avatar_gondola', name: '貢多拉船夫', price: 85, imageUrl: avatarGondolaRider, type: 'base' },
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
  { id: 'acc_hito', name: '動感火柴人', price: 60, imageUrl: hitoImg, type: 'accessory' },
  { id: 'acc_kabocha', name: '搞怪南瓜', price: 25, imageUrl: kabochaImg, type: 'accessory' },
  { id: 'acc_maede_01', name: '變裝精靈', price: 35, imageUrl: maede01Img, type: 'accessory' }
];

const DEFAULT_BASE_URL = baseBearImg;

const StudentDashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('quiz');
  
  // --- 商店相關狀態 ---
  const [inventory, setInventory] = useState([]);
  
  // --- 測驗相關狀態 ---
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStatus, setQuizStatus] = useState('idle'); // idle, playing, result
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [isFirstTry, setIsFirstTry] = useState(true); 

  useEffect(() => {
    // 訂閱使用者資料
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.inventory) {
          setInventory(data.inventory);
        }
      }
    });

    // 取得題庫科目分類
    const fetchSubjects = async () => {
      const qSnap = await getDocs(collection(db, "questions"));
      const subs = new Set();
      qSnap.forEach(doc => {
        if(doc.data().subject) subs.add(doc.data().subject);
      });
      setSubjects(Array.from(subs));
    };
    fetchSubjects();

    return () => unsubUser();
  }, [user.uid]);

  // ================= 測驗功能 =================
  const startQuiz = async () => {
    if(!selectedSubject) return alert('請選擇測驗科目！');
    const qSnap = await getDocs(collection(db, "questions"));
    const allQ = [];
    qSnap.forEach(doc => {
      const data = doc.data();
      if(data.subject === selectedSubject) {
        allQ.push({ id: doc.id, ...data });
      }
    });
    
    if(allQ.length === 0) return alert('該科目目前沒有題目喔！');
    
    // 隨機打亂並取前10題
    const shuffled = allQ.sort(() => 0.5 - Math.random()).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizStatus('playing');
    setShowExplanation(false);
    setQuizStartTime(Date.now());
    setIsFirstTry(true);
  };

  const handleAnswer = async (selectedOption) => {
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;

    // 記錄作答數據
    await addDoc(collection(db, "quiz_logs"), {
      userId: user.uid,
      userName: userData?.name || '未知',
      questionId: currentQ.id,
      questionContent: currentQ.content,
      selectedOption: selectedOption,
      isCorrect: isCorrect,
      isCorrectFirstTry: isCorrect && isFirstTry, 
      timestamp: new Date().toISOString()
    });

    if (isCorrect) {
      if(isFirstTry) setScore(prev => prev + 10);
      
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setShowExplanation(false);
        setIsFirstTry(true);
      } else {
        // 測驗結束，發放金幣
        const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
        let finalScore = score;
        if(isFirstTry) finalScore += 10; // 加上最後一題的分數
        
        let earnedCoins = Math.floor(finalScore / 10); 
        if (finalScore === 100 && timeSpent < 60) earnedCoins += 5; // 滿分且1分鐘內額外獎勵
        
        const newTotalCoins = (userData.coins || 0) + earnedCoins;
        await updateDoc(doc(db, "users", user.uid), { coins: newTotalCoins });
        
        setScore(finalScore);
        setQuizStatus('result');
      }
    } else {
      setIsFirstTry(false);
      setShowExplanation(true);
    }
  };

  // ================= 商店功能 =================
  const buyItem = async (item) => {
    if (userData.coins < item.price) {
      alert('金幣不足！趕快去測驗賺金幣吧！');
      return;
    }
    if (inventory.includes(item.id)) {
      alert('你已經擁有這個物品囉！');
      return;
    }
    
    if (window.confirm(`確定要花費 ${item.price} 金幣購買「${item.name}」嗎？`)) {
      const newCoins = userData.coins - item.price;
      const newInventory = [...inventory, item.id];
      await updateDoc(doc(db, "users", user.uid), {
        coins: newCoins,
        inventory: newInventory
      });
      alert('購買成功！快去裝備箱看看吧！');
    }
  };

  const equipItem = async (item) => {
    if (item.type === 'base') {
      await updateDoc(doc(db, "users", user.uid), { equippedBase: item.id });
    } else if (item.type === 'accessory') {
      // 點擊已裝備的配件會卸下
      if (userData.equippedAccessory === item.id) {
        await updateDoc(doc(db, "users", user.uid), { equippedAccessory: null });
      } else {
        await updateDoc(doc(db, "users", user.uid), { equippedAccessory: item.id });
      }
    }
  };

  if (!userData) return <div style={{textAlign: 'center', padding: '50px'}}>讀取資料中...</div>;

  const currentBase = SHOP_ITEMS.find(i => i.id === userData.equippedBase)?.imageUrl || DEFAULT_BASE_URL;
  const currentAcc = SHOP_ITEMS.find(i => i.id === userData.equippedAccessory)?.imageUrl;

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', paddingBottom: '30px', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif'}}>
      
      {/* 玩家狀態面板 */}
      <div className="pixel-card" style={{backgroundColor: '#fff', border: '5px solid #4a4a4a', padding: '20px', borderRadius: '15px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px'}}>
        <div style={{position: 'relative', width: '120px', height: '120px', backgroundColor: '#e8e8e8', borderRadius: '15px', border: '4px solid #6e85b7', overflow: 'hidden'}}>
          <img src={currentBase} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute'}} />
          {currentAcc && <img src={currentAcc} alt="Accessory" style={{width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', zIndex: 2}} />}
        </div>
        <div>
          <h2 style={{margin: '0 0 10px 0', color: '#2c3e50', fontSize: '2rem'}}>{userData.name}</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 'bold', color: '#d6b75a'}}>
            <img src={moneyIconImg} alt="金幣" style={{width: '30px'}} />
            {userData.coins} 
          </div>
        </div>
      </div>

      {/* 導覽列 */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
        <button className={`pixel-btn ${activeTab==='quiz'?'btn-blue':'btn-gray'}`} style={{flex: 1, padding: '15px', fontSize: '1.2rem'}} onClick={()=>setActiveTab('quiz')}>📝 開始測驗</button>
        <button className={`pixel-btn ${activeTab==='shop'?'btn-yellow':'btn-gray'}`} style={{flex: 1, padding: '15px', fontSize: '1.2rem'}} onClick={()=>setActiveTab('shop')}>🛒 道具商店</button>
        <button className={`pixel-btn ${activeTab==='inventory'?'btn-blue':'btn-gray'}`} style={{flex: 1, padding: '15px', fontSize: '1.2rem'}} onClick={()=>setActiveTab('inventory')}>🎒 我的裝備</button>
      </div>

      {/* 測驗區塊 */}
      {activeTab === 'quiz' && (
        <div className="pixel-card" style={{backgroundColor: '#fff', padding: '30px', borderRadius: '15px', border: '4px solid #4a4a4a'}}>
          {quizStatus === 'idle' && (
            <div style={{textAlign: 'center'}}>
              <h3 style={{fontSize: '1.8rem', color: '#4a4a4a'}}>選擇想挑戰的科目</h3>
              <select style={{width: '100%', padding: '15px', fontSize: '1.2rem', marginTop: '20px', border: '3px solid #6e85b7', borderRadius: '10px'}} value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}>
                <option value="">-- 請選擇 --</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="pixel-btn btn-blue" style={{width: '100%', padding: '20px', fontSize: '1.5rem', marginTop: '30px'}} onClick={startQuiz}>⚔️ 開始挑戰</button>
            </div>
          )}

          {quizStatus === 'playing' && questions.length > 0 && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', color: '#7f8c8d'}}>
                <span>第 {currentQuestionIndex + 1} / {questions.length} 題</span>
                <span style={{color: '#d6b75a'}}>目前得分: {score}</span>
              </div>
              
              <h3 style={{fontSize: '1.5rem', lineHeight: '1.6', marginBottom: '20px'}}>{questions[currentQuestionIndex].content}</h3>
              {questions[currentQuestionIndex].imageUrl && (
                <img src={questions[currentQuestionIndex].imageUrl} alt="題目圖片" style={{maxWidth: '100%', maxHeight: '200px', marginBottom: '20px', borderRadius: '10px', border: '2px solid #ccc'}} />
              )}
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  questions[currentQuestionIndex].options[opt] && (
                    <button key={opt} className="pixel-btn btn-gray" style={{padding: '15px', fontSize: '1.2rem', textAlign: 'left', backgroundColor: '#f8f9fa', color: '#333'}} onClick={() => handleAnswer(opt)}>
                      <strong style={{marginRight: '10px'}}>{opt}.</strong> {questions[currentQuestionIndex].options[opt]}
                    </button>
                  )
                ))}
              </div>

              {showExplanation && (
                <div style={{marginTop: '20px', padding: '20px', backgroundColor: '#fcebeb', border: '3px dashed #e74c3c', borderRadius: '10px', color: '#c0392b', fontSize: '1.2rem'}}>
                  <strong>❌ 答錯了！請再試一次。</strong>
                  {questions[currentQuestionIndex].explanation && (
                    <p style={{marginTop: '10px'}}>💡 提示：{questions[currentQuestionIndex].explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {quizStatus === 'result' && (
            <div style={{textAlign: 'center'}}>
              <h2 style={{fontSize: '2.5rem', color: score >= 80 ? '#2ecc71' : '#f39c12'}}>測驗結束！</h2>
              <p style={{fontSize: '1.5rem', margin: '20px 0'}}>你的得分是：<strong>{score}</strong> 分</p>
              <div style={{display: 'inline-block', backgroundColor: '#fdf6e3', padding: '20px', borderRadius: '15px', border: '3px solid #d6b75a', margin: '20px 0'}}>
                <p style={{fontSize: '1.2rem', margin: 0}}>🎉 恭喜獲得金幣獎勵</p>
                <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#d6b75a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px'}}>
                  <img src={moneyIconImg} alt="金幣" style={{width: '40px'}} /> +{Math.floor(score/10) + (score === 100 ? 5 : 0)}
                </div>
              </div>
              <button className="pixel-btn btn-blue" style={{width: '100%', padding: '15px', fontSize: '1.3rem'}} onClick={() => setQuizStatus('idle')}>🔙 回到題庫選單</button>
            </div>
          )}
        </div>
      )}

      {/* 商店區塊 */}
      {activeTab === 'shop' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px'}}>
          {SHOP_ITEMS.map(item => {
            const isOwned = inventory.includes(item.id) || item.price === 0;
            return (
              <div key={item.id} className="pixel-card" style={{backgroundColor: '#fff', border: '4px solid #4a4a4a', borderRadius: '10px', padding: '15px', textAlign: 'center', opacity: isOwned ? 0.6 : 1}}>
                <img src={item.imageUrl} alt={item.name} style={{width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px'}} />
                <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{item.name}</div>
                <div style={{color: '#d6b75a', fontWeight: 'bold', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'}}>
                  {item.price > 0 ? <><img src={moneyIconImg} alt="金幣" style={{width: '15px'}} /> {item.price}</> : '免費'}
                </div>
                <button 
                  className={`pixel-btn ${isOwned ? 'btn-gray' : 'btn-yellow'}`} 
                  style={{width: '100%', padding: '8px', fontSize: '1rem'}}
                  onClick={() => buyItem(item)}
                  disabled={isOwned}
                >
                  {isOwned ? '已擁有' : '購買'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 裝備區塊 */}
      {activeTab === 'inventory' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px'}}>
          {SHOP_ITEMS.filter(item => inventory.includes(item.id) || item.price === 0).map(item => {
            const isEquipped = userData.equippedBase === item.id || userData.equippedAccessory === item.id;
            return (
              <div key={item.id} className="pixel-card" style={{backgroundColor: isEquipped ? '#fdf6e3' : '#fff', border: `4px solid ${isEquipped ? '#d6b75a' : '#4a4a4a'}`, borderRadius: '10px', padding: '15px', textAlign: 'center'}}>
                <img src={item.imageUrl} alt={item.name} style={{width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px'}} />
                <div style={{fontWeight: 'bold', marginBottom: '10px'}}>{item.name}</div>
                <button 
                  className={`pixel-btn ${isEquipped ? 'btn-red' : 'btn-blue'}`} 
                  style={{width: '100%', padding: '8px', fontSize: '1rem'}}
                  onClick={() => equipItem(item)}
                >
                  {isEquipped ? '卸下' : '裝備'}
                </button>
              </div>
            );
          })}
          {inventory.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#7f8c8d'}}>你的背包空空如也，快去商店買點裝備吧！</div>}
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;