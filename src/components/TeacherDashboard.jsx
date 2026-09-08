import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore'; 
import { db } from '../firebase'; 

// =========================================================================
// 🌟 1. 圖片與資源匯入 
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

// =========================================================================
// 🌟 2. 音效合成器
// =========================================================================
const playSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'add') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.2); 
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.log('音效播放失敗或被瀏覽器阻擋');
  }
};


// =========================================================================
// 🌟 教師控制台主元件
// =========================================================================
const TeacherDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dojo'); 
  
  // --- 單題出題狀態 ---
  const [subject, setSubject] = useState('數學');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [imageBase64, setImageBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSubject, setImportSubject] = useState('數學');
  const [questionsList, setQuestionsList] = useState([]);
  
  // --- 分析狀態 ---
  const [analyticsData, setAnalyticsData] = useState([]);
  const [studentAnalytics, setStudentAnalytics] = useState([]); 

  // --- Dojo 狀態 ---
  const [students, setStudents] = useState([]);
  const [floatingAnims, setFloatingAnims] = useState({});
  const [dojoMode, setDojoMode] = useState('list');
  const [newStudentName, setNewStudentName] = useState(''); 
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [editingNameId, setEditingNameId] = useState(null); 
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 🌟 新增：刪除模式開關狀態

  // --- 座位表自訂狀態 ---
  const [gridCols, setGridCols] = useState(6);
  const [gridRows, setGridRows] = useState(6);

  // --- 倒數計時器狀態 ---
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [customSeconds, setCustomSeconds] = useState("");

  // --- 隨機抽籤狀態 ---
  const [showPicker, setShowPicker] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [displayStudent, setDisplayStudent] = useState(null);
  const [pickerPool, setPickerPool] = useState([]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (activeTab === 'dojo') {
      unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        let stList = [];
        snapshot.forEach((doc) => stList.push({ id: doc.id, ...doc.data() }));
        stList = stList.filter(s => s.email !== user.email); 
        
        stList.sort((a, b) => {
            const nameA = a.name || a.displayName || '未命名';
            const nameB = b.name || b.displayName || '未命名';
            return nameA.localeCompare(nameB);
        });
        
        setStudents(stList);
      });
    } else if (activeTab === 'list') {
      fetchQuestions();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // -------------------------
  // 🌟 手動新增學生
  // -------------------------
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      alert("請填寫姓名與帳號！");
      return;
    }

    let finalEmail = newStudentEmail.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@typ.kh.edu.tw`;
    }

    const q = query(collection(db, "users"), where("email", "==", finalEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      alert(`已經有綁定 ${finalEmail} 的學生囉！`);
      return;
    }
    
    try {
      await addDoc(collection(db, "users"), {
        name: newStudentName.trim(),
        displayName: newStudentName.trim(),
        email: finalEmail, 
        coins: 0,
        equipped: { base: 'base_bear', head: null, face: null, accessory: null },
        seatIndex: -1,
        created_at: new Date().toISOString()
      });
      setNewStudentName(''); 
      setNewStudentEmail(''); 
    } catch (error) {
      console.error("新增學生失敗", error);
    }
  };

  // -------------------------
  // 🌟 刪除學生
  // -------------------------
  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`⚠️ 警告：確定要刪除學生「${studentName}」嗎？\n資料刪除後將無法復原！`)) {
      try {
        await deleteDoc(doc(db, "users", studentId));
      } catch (error) {
        console.error("刪除失敗：", error);
        alert("刪除失敗，請檢查權限或網路連線。");
      }
    }
  };

  const handleSaveName = async (studentId, newName) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, "users", studentId), { name: newName.trim(), displayName: newName.trim() });
      setEditingNameId(null);
    } catch (error) {
      console.error("修改名字失敗", error);
    }
  };

  const handleUpdateCoins = async (targetId, amount) => {
    const isAdd = amount > 0;
    const animType = isAdd ? 'dojo-add' : 'dojo-deduct';
    const animText = isAdd ? `+${amount}` : `${amount}`; 

    playSound(isAdd ? 'add' : 'deduct');

    let newAnims = {};
    if (targetId === 'all') {
      students.forEach(st => {
        newAnims[st.id] = { text: animText, type: animType, key: Date.now() + Math.random() };
      });
    } else {
      newAnims[targetId] = { text: animText, type: animType, key: Date.now() };
    }
    setFloatingAnims(prev => ({ ...prev, ...newAnims }));

    if (targetId === 'all') {
      const promises = students.map(st => {
        const currentCoins = st.coins || 0;
        const newCoins = Math.max(0, currentCoins + amount); 
        return updateDoc(doc(db, "users", st.id), { coins: newCoins });
      });
      await Promise.all(promises);
    } else {
      const st = students.find(s => s.id === targetId);
      const currentCoins = st.coins || 0;
      const newCoins = Math.max(0, currentCoins + amount);
      await updateDoc(doc(db, "users", targetId), { coins: newCoins });
    }

    setTimeout(() => {
      setFloatingAnims({});
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSetCustomTime = () => {
    const m = parseInt(customMinutes) || 0;
    const s = parseInt(customSeconds) || 0;
    if (m > 0 || s > 0) {
      setTimeLeft(m * 60 + s);
    }
  };

  const handleStartPick = () => {
    if (students.length === 0) return;
    let currentPool = [...pickerPool];
    if (currentPool.length === 0) {
      currentPool = students.map(s => s.id);
    }
    setIsPicking(true);
    setPickedStudent(null);

    let tempInterval = setInterval(() => {
      const randomS = students[Math.floor(Math.random() * students.length)];
      setDisplayStudent(randomS);
    }, 100);

    setTimeout(() => {
      clearInterval(tempInterval);
      const winnerId = currentPool[Math.floor(Math.random() * currentPool.length)];
      const winner = students.find(s => s.id === winnerId);
      
      setDisplayStudent(winner);
      setPickedStudent(winner);
      setPickerPool(currentPool.filter(id => id !== winnerId));
      setIsPicking(false);
    }, 2500);
  };

  const handleDragStart = (e, studentId) => { e.dataTransfer.setData("studentId", studentId); };
  const handleDrop = async (e, targetSeatIndex) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData("studentId");
    if (studentId) { await updateDoc(doc(db, "users", studentId), { seatIndex: targetSeatIndex }); }
  };
  const allowDrop = (e) => { e.preventDefault(); };

  const handleRandomSeating = async () => {
    const totalSeats = gridCols * gridRows;
    const occupiedSeats = students.filter(s => s.seatIndex !== undefined && s.seatIndex >= 0 && s.seatIndex < totalSeats).map(s => s.seatIndex);
    const availableSeats = [];
    for (let i = 0; i < totalSeats; i++) { if (!occupiedSeats.includes(i)) availableSeats.push(i); }
    const unseatedStudents = students.filter(s => s.seatIndex === undefined || s.seatIndex < 0 || s.seatIndex >= totalSeats);

    if (unseatedStudents.length > availableSeats.length) {
      alert(`⚠️ 剩餘空位不足！\n目前剩餘 ${availableSeats.length} 個位子，但還有 ${unseatedStudents.length} 個學生未入座，請增加格數。`);
      return;
    }
    const shuffledSeats = availableSeats.sort(() => 0.5 - Math.random());
    const promises = unseatedStudents.map((st, index) => {
      return updateDoc(doc(db, "users", st.id), { seatIndex: shuffledSeats[index] });
    });
    await Promise.all(promises);
  };

  const handleClearSeats = async () => {
    if (!window.confirm("確定要清空所有學生的座位嗎？")) return;
    const promises = students.filter(s => s.seatIndex !== undefined && s.seatIndex !== -1).map(st => updateDoc(doc(db, "users", st.id), { seatIndex: -1 }));
    await Promise.all(promises);
  };

  // -------------------------
  // 🌟 學生卡片元件 (支援刪除模式)
  // -------------------------
  const StudentCard = ({ st, isDraggable = false, hideButtons = false }) => {
    const baseId = st.equipped?.base || st.equippedBase || 'base_bear';
    const accId = st.equipped?.accessory || st.equippedAccessory || null;

    const baseItem = SHOP_ITEMS.find(item => item.id === baseId);
    const accItem = SHOP_ITEMS.find(item => item.id === accId);
    const displayName = st.name || st.displayName || '未命名';
    const [editVal, setEditVal] = useState(displayName);

    return (
      <div 
        className="pixel-box" 
        style={{
          ...styles.dojoCard, 
          padding: hideButtons ? '10px' : '15px',
          // 🌟 進入刪除模式時，卡片外框變成紅色虛線，鼠標變成手指
          border: isDeleteMode ? '4px dashed #e74c3c' : '4px solid #4a4a4a',
          cursor: isDeleteMode ? 'pointer' : (isDraggable ? 'grab' : 'default'),
          opacity: isDeleteMode ? 0.85 : 1
        }}
        draggable={isDraggable && !isDeleteMode}
        onDragStart={(e) => isDraggable && !isDeleteMode && handleDragStart(e, st.id)}
        // 🌟 點擊整張卡片觸發刪除
        onClick={() => {
          if (isDeleteMode) {
            handleDeleteStudent(st.id, displayName);
          }
        }}
      >
        {/* 🌟 刪除模式的紅色大叉叉徽章 */}
        {isDeleteMode && (
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
            ✖
          </div>
        )}

        {floatingAnims[st.id] && (
          <div key={floatingAnims[st.id].key} className={`dojo-anim ${floatingAnims[st.id].type}`}>
            {floatingAnims[st.id].text}
          </div>
        )}
        
        {/* 🌟 讓內部元素在刪除模式下不干擾點擊 */}
        <div style={{ pointerEvents: isDeleteMode ? 'none' : 'auto' }}>
          <div style={{ position: 'relative', width: hideButtons ? '60px' : '80px', height: hideButtons ? '60px' : '80px', margin: '0 auto 10px', backgroundColor: '#e8e8e8', borderRadius: '15px', border: '3px solid #6e85b7', overflow: 'hidden' }}>
            <img src={baseItem ? baseItem.imageUrl : DEFAULT_BASE_URL} alt="base" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
            {accItem && <img src={accItem.imageUrl} alt="acc" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 2 }} />}
          </div>
          
          {editingNameId === st.id ? (
            <input 
               type="text" 
               value={editVal}
               autoFocus
               onChange={(e) => setEditVal(e.target.value)}
               onBlur={() => handleSaveName(st.id, editVal)}
               onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(st.id, editVal); }}
               style={{width: '90%', textAlign: 'center', marginBottom: '5px', padding: '2px', fontWeight: 'bold'}}
            />
          ) : (
            <div 
              style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px', cursor: 'pointer'}} 
              onDoubleClick={() => {setEditingNameId(st.id); setEditVal(displayName);}}
              title="點兩下修改名字"
            >
              {displayName}
            </div>
          )}
          
          <div style={{fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '5px', wordBreak: 'break-all', padding: '0 5px'}}>
            {st.email || '未綁定 Email'}
          </div>
          
          <div style={{fontSize: '1.2rem', color: '#d6b75a', fontWeight: 'bold', marginBottom: hideButtons ? '0' : '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'}}>
            <img src={moneyIconImg} alt="金幣" style={{width: '20px', height: '20px'}} />{st.coins || 0}
          </div>
        </div>
        
        {/* 🌟 只有在「不是刪除模式」且「允許顯示按鈕」時，才顯示加扣分按鈕 */}
        {!hideButtons && !isDeleteMode && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px'}}>
             <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
              <button className="pixel-btn btn-blue" style={styles.miniBtn} onClick={() => handleUpdateCoins(st.id, 1)}>+1</button>
              <button className="pixel-btn btn-blue" style={styles.miniBtn} onClick={() => handleUpdateCoins(st.id, 5)}>+5</button>
              <button className="pixel-btn btn-blue" style={styles.miniBtn} onClick={() => handleUpdateCoins(st.id, 10)}>+10</button>
            </div>
            <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
              <button className="pixel-btn btn-red" style={styles.miniBtn} onClick={() => handleUpdateCoins(st.id, -1)}>-1</button>
              <button className="pixel-btn btn-red" style={styles.miniBtn} onClick={() => handleUpdateCoins(st.id, -5)}>-5</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const fetchAnalytics = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap = {};
      usersSnap.forEach(doc => { userMap[doc.id] = doc.data().name || doc.data().displayName || '未命名'; });

      const logsSnapshot = await getDocs(collection(db, "quiz_logs"));
      const stats = {};     
      const stStats = {};   

      logsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!stats[data.questionId]) {
          stats[data.questionId] = { content: data.questionContent, total: 0, wrong: 0 };
        }
        stats[data.questionId].total += 1;
        if (!data.isCorrectFirstTry) {
           stats[data.questionId].wrong += 1;
        }

        const uid = data.userId;
        if (uid) {
          if (!stStats[uid]) {
            stStats[uid] = { name: userMap[uid] || data.userName || '未知學生', total: 0, correct: 0 };
          }
          stStats[uid].total += 1;
          if (data.isCorrectFirstTry) {
            stStats[uid].correct += 1;
          }
        }
      });

      const analysisArray = Object.keys(stats).map(qId => {
        const item = stats[qId];
        return { ...item, errorRate: Math.round((item.wrong / item.total) * 100) };
      });
      analysisArray.sort((a, b) => b.errorRate - a.errorRate);
      setAnalyticsData(analysisArray);

      const stArray = Object.keys(stStats).map(uid => {
        const item = stStats[uid];
        return { ...item, accuracyRate: Math.round((item.correct / item.total) * 100) || 0 };
      });
      stArray.sort((a, b) => b.accuracyRate - a.accuracyRate); 
      setStudentAnalytics(stArray);

    } catch (error) {
      console.error("讀取數據失敗:", error);
    }
  };

  const fetchQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, "questions"));
    let fetched = [];
    querySnapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
    fetched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setQuestionsList(fetched);
  };

  const handleDelete = async (id) => {
    if (window.confirm("確定刪除這道題目？")) {
      await deleteDoc(doc(db, "questions", id));
      fetchQuestions();
    }
  };

  const parseCSVRow = (str) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && str[i+1] === '"') { current += '"'; i++; } 
      else if (char === '"') { inQuotes = !inQuotes; } 
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; } 
      else { current += char; }
    }
    result.push(current);
    return result;
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsSubmitting(true);
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = parseCSVRow(lines[0]).map(h => h.trim());
        const qIdx = headers.indexOf('題目');
        const ansIdx = headers.indexOf('正確答案');
        const opt1Idx = headers.indexOf('選項一');
        const expIdx = headers.indexOf('詳解'); 
        
        if (qIdx === -1 || ansIdx === -1 || opt1Idx === -1) {
          return alert('CSV 格式錯誤！必須包含「題目」、「正確答案」、「選項一」等欄位標題。');
        }

        let successCount = 0;
        const answerMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };

        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVRow(lines[i]);
          if (!row[qIdx] || !row[ansIdx]) continue; 

          const qContent = row[qIdx].trim();
          const qAns = answerMap[row[ansIdx].trim()] || 'A';
          const qOpt = {
            A: row[opt1Idx]?.trim() || '', B: row[opt1Idx + 1]?.trim() || '',
            C: row[opt1Idx + 2]?.trim() || '', D: row[opt1Idx + 3]?.trim() || ''
          };
          const qExp = expIdx !== -1 ? row[expIdx]?.trim() : '';

          await addDoc(collection(db, "questions"), {
            subject: importSubject,
            content: qContent, options: qOpt, correct_answer: qAns,
            explanation: qExp, imageUrl: null, created_at: new Date().toISOString()
          });
          successCount++;
        }
        alert(`🎉 成功匯入 ${successCount} 題！`);
      } catch (error) {
        alert('檔案解析失敗，請確保存為 UTF-8 編碼的 CSV 檔。');
      } finally {
        setIsSubmitting(false); e.target.value = null; 
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      if (items[index].kind === 'file' && items[index].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => setImageBase64(event.target.result);
        reader.readAsDataURL(items[index].getAsFile());
      }
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "questions"), {
        subject, content, explanation, imageUrl: imageBase64 || null, 
        options, correct_answer: correctAnswer, created_at: new Date().toISOString()
      });
      alert("🎉 題目新增成功！");
      setContent(''); setExplanation(''); setImageBase64('');
      setOptions({ A: '', B: '', C: '', D: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes dojoFloat {
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -60px) scale(1.5); }
        }
        .dojo-anim {
          position: absolute; top: 30%; left: 50%; animation: dojoFloat 1s ease-out forwards;
          font-weight: bold; font-size: 3rem; text-shadow: 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff; z-index: 10; pointer-events: none;
        }
        .dojo-add { color: #2ecc71; }
        .dojo-deduct { color: #e74c3c; }
      `}</style>

      <h2 style={styles.pageTitle}>👩‍🏫 教師控制台</h2>

      {/* 導覽列 */}
      <div style={styles.tabContainer}>
        <button className={`pixel-btn ${activeTab==='dojo' ? 'btn-yellow' : 'btn-gray'}`} style={{...styles.tabBtn, color: activeTab==='dojo'?'#4a4a4a':''}} onClick={()=>setActiveTab('dojo')}>🌟 班級經營</button>
        <button className={`pixel-btn ${activeTab==='import' ? 'btn-blue' : 'btn-gray'}`} style={styles.tabBtn} onClick={()=>setActiveTab('import')}>📂 CSV 匯入</button>
        <button className={`pixel-btn ${activeTab==='add' ? 'btn-blue' : 'btn-gray'}`} style={styles.tabBtn} onClick={()=>setActiveTab('add')}>➕ 單題圖文新增</button>
        <button className={`pixel-btn ${activeTab==='list' ? 'btn-blue' : 'btn-gray'}`} style={styles.tabBtn} onClick={()=>setActiveTab('list')}>📚 題庫總覽</button>
        <button className={`pixel-btn ${activeTab==='analytics' ? 'btn-yellow' : 'btn-gray'}`} style={{...styles.tabBtn, color: activeTab==='analytics'?'#4a4a4a':''}} onClick={()=>setActiveTab('analytics')}>📊 數據分析</button>
      </div>

      {/* --- 🌟 Dojo 班級經營區塊 --- */}
      {activeTab === 'dojo' && (
        <div className="pixel-card" style={{...styles.card, backgroundColor: '#fdf6e3'}}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px dashed #ccc', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button className={`pixel-btn ${dojoMode === 'list' ? 'btn-yellow' : 'btn-gray'}`} style={{color: '#4a4a4a', padding: '10px'}} onClick={() => setDojoMode('list')}>📋 一般列表</button>
              <button className={`pixel-btn ${dojoMode === 'seat' ? 'btn-yellow' : 'btn-gray'}`} style={{color: '#4a4a4a', padding: '10px'}} onClick={() => setDojoMode('seat')}>🪑 自訂座位表</button>
              
              {/* 🌟 這是您要的左上方「刪除模式」開關按鈕 */}
              <button 
                className={`pixel-btn ${isDeleteMode ? 'btn-red' : 'btn-gray'}`} 
                style={{color: isDeleteMode ? 'white' : '#4a4a4a', padding: '10px'}} 
                onClick={() => setIsDeleteMode(!isDeleteMode)}
              >
                {isDeleteMode ? '退出刪除模式' : '🗑️ 刪除學生'}
              </button>

              <form onSubmit={handleAddStudent} style={{display: 'flex', gap: '5px', marginLeft: '10px', alignItems: 'center'}}>
                <input 
                  type="text" 
                  placeholder="姓名 (例: 王小明)" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{padding: '8px', border: '3px solid #4a4a4a', width: '120px'}}
                />
                <input 
                  type="text" 
                  placeholder="帳號 (例: s110123)" 
                  title="輸入帳號，系統會自動補齊 @typ.kh.edu.tw"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  style={{padding: '8px', border: '3px solid #4a4a4a', width: '150px'}}
                />
                <button type="submit" className="pixel-btn btn-blue" style={{padding: '8px'}}>➕ 綁定新增</button>
              </form>
            </div>
            
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button className="pixel-btn btn-blue" style={{padding: '10px 20px', fontSize: '1.2rem'}} onClick={() => setShowPicker(true)}>🎲 隨機抽籤</button>
              <button className="pixel-btn btn-blue" style={{padding: '10px 20px', fontSize: '1.2rem'}} onClick={() => setShowTimer(true)}>⏱️ 倒數計時</button>
              
              <div style={{borderLeft: '2px solid #ccc', height: '30px', margin: '0 10px'}}></div>
              <span style={{fontWeight: 'bold', color: '#4a4a4a', fontSize: '1.2rem'}}>全班：</span>
              <div style={{display: 'flex', gap: '5px'}}>
                <button className="pixel-btn btn-blue" style={{padding: '5px 10px', fontSize: '1rem'}} onClick={() => handleUpdateCoins('all', 1)}>+1</button>
                <button className="pixel-btn btn-blue" style={{padding: '5px 10px', fontSize: '1rem'}} onClick={() => handleUpdateCoins('all', 5)}>+5</button>
                <button className="pixel-btn btn-blue" style={{padding: '5px 10px', fontSize: '1rem'}} onClick={() => handleUpdateCoins('all', 10)}>+10</button>
                <button className="pixel-btn btn-red" style={{padding: '5px 10px', fontSize: '1rem'}} onClick={() => handleUpdateCoins('all', -1)}>-1</button>
                <button className="pixel-btn btn-red" style={{padding: '5px 10px', fontSize: '1rem'}} onClick={() => handleUpdateCoins('all', -5)}>-5</button>
              </div>
            </div>
          </div>

          <p style={{color: '#7f8c8d', marginBottom: '15px'}}>💡 提示：輸入帳號時不需打 @，系統會自動幫您補齊教育局網域！在學生姓名上「連點兩下」可以修改名稱。</p>

          {dojoMode === 'list' ? (
            <div style={styles.dojoGrid}>
              {students.map(st => <StudentCard key={st.id} st={st} hideButtons={false} />)}
            </div>
          ) : (
            <div>
              {/* 座位表工具列 */}
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#e8e8e8', padding: '15px', borderRadius: '10px', border: '3px solid #b2bec3'}}>
                <span style={{fontWeight: 'bold', color: '#4a4a4a', fontSize: '1.2rem'}}>⚙️ 座位表設定：</span>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <label style={{fontWeight: 'bold'}}>直欄數：</label>
                  <input type="number" min="1" max="15" value={gridCols} onChange={e => setGridCols(parseInt(e.target.value) || 1)} style={{width: '60px', padding: '5px', border: '3px solid #4a4a4a', borderRadius: '5px', fontSize: '1.1rem'}}/>
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px'}}>
                  <label style={{fontWeight: 'bold'}}>橫排數：</label>
                  <input type="number" min="1" max="15" value={gridRows} onChange={e => setGridRows(parseInt(e.target.value) || 1)} style={{width: '60px', padding: '5px', border: '3px solid #4a4a4a', borderRadius: '5px', fontSize: '1.1rem'}}/>
                </div>
                
                <button className="pixel-btn btn-blue" style={{padding: '8px 15px', fontSize: '1.1rem'}} onClick={handleRandomSeating}>🎲 隨機入座 (針對未入座者)</button>
                <button className="pixel-btn btn-red" style={{padding: '8px 15px', fontSize: '1.1rem'}} onClick={handleClearSeats}>🧹 清空全部座位</button>
              </div>

              <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e8e8e8', borderRadius: '10px', minHeight: '130px', display: 'flex', gap: '10px', flexWrap: 'wrap', border: '3px dashed #b2bec3'}} onDrop={(e) => handleDrop(e, -1)} onDragOver={allowDrop}>
                <div style={{width: '100%', fontWeight: 'bold', color: '#4a4a4a'}}>🚶 未編排座位的學生：</div>
                {students.filter(s => s.seatIndex === undefined || s.seatIndex === -1 || s.seatIndex >= gridCols * gridRows).map(st => (
                  <div key={st.id} style={{transform: 'scale(0.9)', transformOrigin: 'top left'}}>
                    <StudentCard st={st} isDraggable={true} hideButtons={true} />
                  </div>
                ))}
              </div>

              <div style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '10px', backgroundColor: '#fff', padding: '20px', border: '4px solid #4a4a4a', borderRadius: '15px'}}>
                {Array.from({ length: gridCols * gridRows }).map((_, idx) => {
                  const occupant = students.find(s => s.seatIndex === idx);
                  return (
                    <div 
                      key={idx} 
                      style={{ height: '140px', border: '2px dashed #ccc', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: occupant ? 'transparent' : '#fafafa', overflow: 'hidden' }}
                      onDrop={(e) => handleDrop(e, idx)} 
                      onDragOver={allowDrop}
                    >
                      {occupant && <StudentCard st={occupant} isDraggable={true} hideButtons={true} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CSV 匯入 --- */}
      {activeTab === 'import' && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>📂 匯入題庫 CSV</h3>
          <div style={{...styles.inputGroup, textAlign: 'left', marginBottom: '20px'}}>
            <label style={styles.label}>請選擇科目：</label>
            <select style={styles.input} value={importSubject} onChange={(e) => setImportSubject(e.target.value)}>
              <option value="數學">數學</option><option value="國語">國語</option>
            </select>
          </div>
          <div style={{padding: '30px', border: '4px dashed #4a4a4a', backgroundColor: '#fff', textAlign: 'center'}}>
            <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isSubmitting} style={{fontSize: '1.2rem'}} />
            {isSubmitting && <p style={{color: '#c0392b', fontWeight: 'bold'}}>⏳ 匯入中...</p>}
          </div>
        </div>
      )}

      {/* --- 單題圖文新增 --- */}
      {activeTab === 'add' && (
        <form className="pixel-card" style={styles.card} onSubmit={handleManualSubmit}>
           <h3 style={styles.sectionTitle}>➕ 新增圖文題目</h3>
           <div style={{...styles.inputGroup, textAlign: 'left'}}>
             <label style={styles.label}>選擇科目：</label>
             <select style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)}>
               <option value="數學">數學</option>
               <option value="國語">國語</option>
               <option value="自然">自然</option>
               <option value="社會">社會</option>
             </select>
           </div>
           
           <div style={styles.inputGroup}>
            <label style={styles.label}>題目圖片 (選填，點擊框內 Ctrl+V 或 Mac ⌘+V 貼上)：</label>
            <div style={{...styles.pasteArea, borderColor: imageBase64 ? '#8ca279' : '#6e85b7'}} onPaste={handlePaste} tabIndex={0}>
              {imageBase64 ? <img src={imageBase64} alt="預覽" style={styles.previewImage} /> : <p>👉 點擊此處，按下貼上快捷鍵</p>}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>題目補充文字：</label>
            <textarea style={styles.input} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt} style={{display: 'flex', gap: '10px', alignItems:'center', marginBottom: '10px'}}>
                <label style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{opt}.</label>
                <input style={styles.input} required value={options[opt]} onChange={(e) => setOptions({...options, [opt]: e.target.value})} />
              </div>
            ))}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>正確解答：</label>
            <select style={styles.input} value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>錯題詳解提示 (選填，學生答錯時會看到)：</label>
            <textarea style={{...styles.input, height: '80px'}} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="例如：面積公式是底×高÷2，請注意有沒有除以2喔！" />
          </div>

          <button type="submit" className="pixel-btn btn-blue" style={{width: '100%', padding: '15px', fontSize: '1.2rem'}} disabled={isSubmitting}>✅ 儲存題目</button>
        </form>
      )}

      {/* --- 題庫總覽 --- */}
      {activeTab === 'list' && (
        <div className="pixel-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>📚 已建立的題庫 ({questionsList.length} 題)</h3>
          {questionsList.map((q) => (
            <div key={q.id} style={{padding: '15px', border: '4px solid #4a4a4a', marginBottom: '15px', backgroundColor:'#fff', textAlign: 'left'}}>
               <div style={{display:'flex', justifyContent:'space-between'}}>
                 <span style={{fontWeight:'bold', fontSize:'1.2rem'}}>[{q.subject || '未分類'}] {q.content}</span>
                 <button className="pixel-btn btn-red" style={{padding:'5px'}} onClick={()=>handleDelete(q.id)}>刪除</button>
               </div>
               {q.imageUrl && <img src={q.imageUrl} alt="圖" style={{maxHeight:'100px', marginTop:'10px'}} />}
               <div style={{marginTop:'10px', color:'#7f8c8d'}}>正確答案：{q.correct_answer}</div>
            </div>
          ))}
        </div>
      )}

      {/* --- 🌟 學習數據分析 --- */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="pixel-card" style={styles.card}>
            <h3 style={styles.sectionTitle}>🧑‍🎓 各生測驗情形</h3>
            <p style={{fontSize:'1.1rem', color:'#7f8c8d'}}>掌握每位學生的總作答量與整體答對率。</p>
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize:'1.2rem', backgroundColor:'#fff', border:'4px solid #4a4a4a'}}>
              <thead>
                <tr style={{backgroundColor: '#4a4a4a', color: '#fff', textAlign: 'left'}}>
                  <th style={styles.th}>學生姓名</th>
                  <th style={styles.th}>總作答題數</th>
                  <th style={styles.th}>首次答對題數</th>
                  <th style={styles.th}>整體答對率</th>
                </tr>
              </thead>
              <tbody>
                {studentAnalytics.map((st, idx) => (
                  <tr key={idx} style={{borderBottom: '2px solid #ccc'}}>
                    <td style={styles.td}>{st.name}</td>
                    <td style={styles.td}>{st.total} 題</td>
                    <td style={styles.td}>{st.correct} 題</td>
                    <td style={styles.td}>
                      <span style={{color: st.accuracyRate >= 80 ? '#2ecc71' : st.accuracyRate < 60 ? '#e74c3c' : '#f39c12', fontWeight: 'bold'}}>
                        {st.accuracyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {studentAnalytics.length === 0 && (
                  <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center'}}>尚無測驗記錄</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pixel-card" style={styles.card}>
            <h3 style={styles.sectionTitle}>📊 單題錯題排行榜 (首答錯誤率)</h3>
            <p style={{fontSize:'1.1rem', color:'#7f8c8d'}}>此數據追蹤學生「第一次作答」的錯誤率，幫助找出需要重點補強的概念。</p>
            
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize:'1.2rem', backgroundColor:'#fff', border:'4px solid #4a4a4a'}}>
              <thead>
                <tr style={{backgroundColor: '#6e85b7', color: '#fff', textAlign: 'left'}}>
                  <th style={styles.th}>題目內容</th>
                  <th style={styles.th}>作答次數</th>
                  <th style={styles.th}>答錯次數</th>
                  <th style={styles.th}>錯誤率</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((data, idx) => (
                  <tr key={idx} style={{borderBottom: '2px solid #ccc', backgroundColor: data.errorRate > 50 ? '#fcebeb' : '#fff'}}>
                    <td style={styles.td}>{data.content || '(圖片題)'}</td>
                    <td style={styles.td}>{data.total}</td>
                    <td style={styles.td}><span style={{color: '#c0392b', fontWeight: 'bold'}}>{data.wrong}</span></td>
                    <td style={styles.td}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{flex: 1, height: '15px', backgroundColor: '#e8e8e8', border:'2px solid #4a4a4a'}}>
                          <div style={{width: `${data.errorRate}%`, height: '100%', backgroundColor: data.errorRate > 50 ? '#c0392b' : '#d6b75a'}}></div>
                        </div>
                        <span>{data.errorRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {analyticsData.length === 0 && (
                  <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center'}}>尚無測驗記錄</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- 🌟 模態框：倒數計時器 --- */}
      {showTimer && (
        <div style={styles.modalOverlay}>
          <div className="pixel-card" style={styles.modalContent}>
            <h3 style={styles.sectionTitle}>⏱️ 倒數計時</h3>
            
            <div style={{fontSize: '5rem', fontWeight: 'bold', color: timeLeft === 0 ? '#e74c3c' : '#4a4a4a', textAlign: 'center', margin: '20px 0'}}>
              {formatTime(timeLeft)}
            </div>
            
            {!timerActive && (
              <>
                <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px'}}>
                  <button className="pixel-btn btn-gray" onClick={() => setTimeLeft(60)}>1 分鐘</button>
                  <button className="pixel-btn btn-gray" onClick={() => setTimeLeft(180)}>3 分鐘</button>
                  <button className="pixel-btn btn-gray" onClick={() => setTimeLeft(300)}>5 分鐘</button>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '25px'}}>
                  <input 
                    type="number" min="0" placeholder="分" 
                    style={{width: '70px', padding: '8px', fontSize: '1.2rem', textAlign: 'center', border: '3px solid #4a4a4a'}} 
                    value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} 
                  />
                  <span style={{fontSize: '1.5rem', fontWeight: 'bold'}}>:</span>
                  <input 
                    type="number" min="0" max="59" placeholder="秒" 
                    style={{width: '70px', padding: '8px', fontSize: '1.2rem', textAlign: 'center', border: '3px solid #4a4a4a'}} 
                    value={customSeconds} onChange={e => setCustomSeconds(e.target.value)} 
                  />
                  <button className="pixel-btn btn-yellow" style={{padding: '8px 15px', color: '#4a4a4a'}} onClick={handleSetCustomTime}>設定</button>
                </div>
              </>
            )}

            <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
              <button className="pixel-btn btn-blue" style={{fontSize: '1.5rem', padding: '10px 30px'}} onClick={() => setTimerActive(!timerActive)}>
                {timerActive ? '暫停' : '開始'}
              </button>
              <button className="pixel-btn btn-red" style={{fontSize: '1.5rem', padding: '10px 30px'}} onClick={() => {setTimerActive(false); setTimeLeft(0);}}>
                重設
              </button>
              <button className="pixel-btn btn-gray" style={{fontSize: '1.5rem', padding: '10px 30px'}} onClick={() => setShowTimer(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 🌟 模態框：隨機抽籤 --- */}
      {showPicker && (
        <div style={styles.modalOverlay}>
          <div className="pixel-card" style={{...styles.modalContent, textAlign: 'center'}}>
            <h3 style={styles.sectionTitle}>🎲 命運抽籤</h3>
            
            <div style={{margin: '30px auto', width: '200px', height: '200px', backgroundColor: '#e8e8e8', borderRadius: '20px', border: '5px solid #6e85b7', position: 'relative', overflow: 'hidden'}}>
              {displayStudent ? (
                <>
                  <img src={SHOP_ITEMS.find(item => item.id === (displayStudent.equipped?.base || displayStudent.equippedBase || 'base_bear'))?.imageUrl || DEFAULT_BASE_URL} alt="base" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                  {SHOP_ITEMS.find(item => item.id === (displayStudent.equipped?.accessory || displayStudent.equippedAccessory)) && (
                    <img src={SHOP_ITEMS.find(item => item.id === (displayStudent.equipped?.accessory || displayStudent.equippedAccessory)).imageUrl} alt="acc" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
                  )}
                </>
              ) : (
                <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '4rem'}}>❓</div>
              )}
            </div>
            
            <h2 style={{fontSize: '2.5rem', color: '#2c3e50', marginBottom: '20px'}}>
              {displayStudent ? displayStudent.name : '準備好了嗎？'}
            </h2>

            <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
              <button className="pixel-btn btn-yellow" style={{fontSize: '1.5rem', padding: '10px 30px', color: '#4a4a4a'}} onClick={handleStartPick} disabled={isPicking}>
                {isPicking ? '抽籤中...' : '抽出幸運兒！'}
              </button>
              
              {pickedStudent && !isPicking && (
                <button className="pixel-btn btn-blue" style={{fontSize: '1.5rem', padding: '10px 30px'}} onClick={() => handleUpdateCoins(pickedStudent.id, 5)}>
                  給 {pickedStudent.name} +5 💰
                </button>
              )}
              
              <button className="pixel-btn btn-gray" style={{fontSize: '1.5rem', padding: '10px 30px'}} onClick={() => setShowPicker(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  // 🌟 將 maxWidth 改回 100%，這會讓卡片隨大螢幕無限延伸排版
  container: { maxWidth: '100%', margin: '0 auto', padding: '20px 40px', fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif' },
  pageTitle: { fontSize: '2.5rem', color: '#4a4a4a', marginBottom: '20px' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tabBtn: { padding: '10px 20px', fontSize: '1.2rem' },
  card: { padding: '30px', backgroundColor: '#f2efeb' },
  sectionTitle: { fontSize: '1.8rem', color: '#4a4a4a', marginBottom: '20px', borderBottom: '2px dashed #4a4a4a', paddingBottom: '10px' },
  
  inputGroup: { marginBottom: '15px', textAlign: 'left' },
  label: { display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: '#4a4a4a', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', fontSize: '1.1rem', border: '3px solid #4a4a4a', boxSizing: 'border-box' },
  pasteArea: { width: '100%', minHeight: '100px', border: '3px dashed', backgroundColor: '#e8e8e8', display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' },
  previewImage: { maxHeight: '150px' },

  dojoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
  dojoCard: { position: 'relative', backgroundColor: '#fff', textAlign: 'center', border: '4px solid #4a4a4a', borderRadius: '15px', cursor: 'grab' },
  miniBtn: { padding: '4px 8px', fontSize: '0.9rem', flex: 1 },
  
  th: { padding: '15px', borderBottom: '4px solid #4a4a4a' },
  td: { padding: '15px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { backgroundColor: '#fff', padding: '40px', borderRadius: '15px', minWidth: '400px' }
};

export default TeacherDashboard;