import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 商城販售的道具清單 (MVP 使用 Emoji 疊加)
const SHOP_ITEMS = [
  { id: 'hat_cap', type: 'head', name: '帥氣棒球帽', emoji: '🧢', price: 10 },
  { id: 'hat_crown', type: 'head', name: '國王皇冠', emoji: '👑', price: 50 },
  { id: 'face_glasses', type: 'face', name: '文青眼鏡', emoji: '👓', price: 20 },
  { id: 'face_sunglasses', type: 'face', name: '明星墨鏡', emoji: '🕶️', price: 30 },
];

const StudentHome = ({ user, onStartQuiz }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 抓取學生最新資料 (金幣、裝備)
  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        // 確保資料庫有預設的裝備欄位，若無則給予預設值
        setUserData({
          ...data,
          owned_items: data.owned_items || [],
          equipped: data.equipped || { head: null, face: null }
        });
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [user.uid]);

  // 購買道具
  const handleBuy = async (item) => {
    if (userData.coins < item.price) {
      alert("⚠️ 金幣不夠喔！趕快去參加測驗賺取金幣吧！");
      return;
    }
    if (window.confirm(`確定要花 ${item.price} 枚金幣購買「${item.name}」嗎？`)) {
      const userRef = doc(db, "users", user.uid);
      const newCoins = userData.coins - item.price;
      const newOwnedItems = [...userData.owned_items, item.id];
      
      await updateDoc(userRef, {
        coins: newCoins,
        owned_items: newOwnedItems
      });

      setUserData({ ...userData, coins: newCoins, owned_items: newOwnedItems });
      alert("🎉 購買成功！請點擊裝備來穿上它。");
    }
  };

  // 穿上 / 脫下 道具
  const handleEquip = async (item) => {
    const newEquipped = { ...userData.equipped };
    
    // 如果已經裝備了就脫下，否則就穿上
    if (newEquipped[item.type] === item.emoji) {
      newEquipped[item.type] = null; 
    } else {
      newEquipped[item.type] = item.emoji;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { equipped: newEquipped });
    setUserData({ ...userData, equipped: newEquipped });
  };

  if (isLoading) return <div style={styles.container}><h2>⏳ 載入中...</h2></div>;

  return (
    <div style={styles.container}>
      {/* 頂部資訊列 */}
      <div style={styles.header}>
        <h2>你好，{userData.name}！</h2>
        <div style={styles.coinBadge}>💰 金幣：{userData.coins}</div>
      </div>

      <div style={styles.mainLayout}>
        {/* 左側：紙娃娃展示區 */}
        <div style={styles.avatarCard}>
          <h3 style={styles.cardTitle}>我的造型</h3>
          <div style={styles.avatarDisplay}>
            {/* 基礎熊熊 */}
            <div style={styles.baseAvatar}>🐻</div>
            {/* 頭部裝備圖層 */}
            {userData.equipped.head && <div style={styles.headLayer}>{userData.equipped.head}</div>}
            {/* 臉部裝備圖層 */}
            {userData.equipped.face && <div style={styles.faceLayer}>{userData.equipped.face}</div>}
          </div>
          <button style={styles.startBtn} onClick={onStartQuiz}>
            📝 開始今日測驗 ➔
          </button>
        </div>

        {/* 右側：道具商城 */}
        <div style={styles.shopCard}>
          <h3 style={styles.cardTitle}>🛍️ 造型商城</h3>
          <div style={styles.shopGrid}>
            {SHOP_ITEMS.map((item) => {
              const isOwned = userData.owned_items.includes(item.id);
              const isEquipped = userData.equipped[item.type] === item.emoji;

              return (
                <div key={item.id} style={styles.itemCard}>
                  <div style={styles.itemEmoji}>{item.emoji}</div>
                  <div style={styles.itemName}>{item.name}</div>
                  
                  {!isOwned ? (
                    <button style={styles.buyBtn} onClick={() => handleBuy(item)}>
                      💰 {item.price} 購買
                    </button>
                  ) : (
                    <button 
                      style={{...styles.equipBtn, backgroundColor: isEquipped ? '#e74c3c' : '#2ecc71'}} 
                      onClick={() => handleEquip(item)}
                    >
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
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' },
  coinBadge: { backgroundColor: '#f1c40f', color: '#8e44ad', padding: '10px 20px', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  mainLayout: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  
  /* 紙娃娃展示區樣式 */
  avatarCard: { flex: '1', minWidth: '300px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  cardTitle: { color: '#2c3e50', marginTop: 0 },
  avatarDisplay: { position: 'relative', width: '150px', height: '150px', backgroundColor: '#ebf5fb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' },
  baseAvatar: { fontSize: '80px', position: 'absolute' },
  headLayer: { fontSize: '60px', position: 'absolute', top: '-15px', right: '15px', transform: 'rotate(15deg)' },
  faceLayer: { fontSize: '55px', position: 'absolute', top: '35px' },
  startBtn: { marginTop: '20px', width: '100%', padding: '15px', fontSize: '1.3rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },

  /* 商城區樣式 */
  shopCard: { flex: '2', minWidth: '300px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  shopGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' },
  itemCard: { border: '2px solid #ecf0f1', borderRadius: '10px', padding: '15px', textAlign: 'center', backgroundColor: '#fafcc' },
  itemEmoji: { fontSize: '3rem', marginBottom: '10px' },
  itemName: { fontSize: '1.1rem', fontWeight: 'bold', color: '#34495e', marginBottom: '10px' },
  buyBtn: { width: '100%', padding: '8px', backgroundColor: '#f1c40f', color: '#5d4037', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  equipBtn: { width: '100%', padding: '8px', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
};

export default StudentHome;