import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeacherDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('reports'); // 'upload' 或 'reports'
  
  // 匯入相關狀態
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // 報表相關狀態
  const [records, setRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // 📥 產生並下載 CSV 空白範本
  const handleDownloadTemplate = () => {
    const headers = '\uFEFF' + "題型 (選擇/是非),科目,題目內容,選項 A (若是非題填O/X),選項 B,選項 C,選項 D,正確解答 (A/B/C/D),總配分,部分給分設定 (例: B:2),提示 (作答時顯示),解析 (交卷後顯示),需要注音 (是/否)\n";
    const exampleRow = "選擇題,數學,若一件衣服賣 1200 元，買 30 件需要多少元？,36000,3600,360000,360,A,10,B:2,注意尾數有幾個 0 哦！可以先把 12 乘上 3。,1200 的尾數有 2 個 0，30 的尾數有 1 個 0。先算 12×3=36，後面再補上 3 個 0，答案是 36000。,否\n";
    const csvContent = headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "測驗題庫匯入範本.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 處理上傳
  const handleFileChange = (e) => { setFile(e.target.files[0]); setMessage(""); };
  const handleUpload = () => {
    if (!file) { setMessage("⚠️ 請先選擇一個 CSV 檔案！"); return; }
    setIsUploading(true); setMessage("⏳ 正在讀取並上傳題庫，請稍候...");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const questionsRef = collection(db, "questions");
        let successCount = 0;
        try {
          for (const row of results.data) {
            let partialScores = {};
            if (row["部分給分設定 (例: B:2)"]) {
              row["部分給分設定 (例: B:2)"].split(",").forEach(p => {
                const [key, val] = p.split(":");
                if (key && val) partialScores[key.trim()] = Number(val.trim());
              });
            }
            await addDoc(questionsRef, {
              type: row["題型 (選擇/是非)"] || "選擇題",
              subject: row["科目"] || "未分類",
              content: row["題目內容"],
              options: { A: row["選項 A (若是非題填O/X)"] || "", B: row["選項 B"] || "", C: row["選項 C"] || "", D: row["選項 D"] || "" },
              correct_answer: row["正確解答 (A/B/C/D)"] || "A",
              points: Number(row["總配分"]) || 10,
              partial_scores: partialScores,
              hint: row["提示 (作答時顯示)"] || "",
              explanation: row["解析 (交卷後顯示)"] || "",
              needs_zhuyin: row["需要注音 (是/否)"] === "是",
              teacher_id: user.uid,
              created_at: new Date().toISOString()
            });
            successCount++;
          }
          setMessage(`✅ 匯入成功！共新增了 ${successCount} 題到題庫中。`);
          setFile(null); fileInputRef.current.value = "";
        } catch (error) {
          setMessage("❌ 上傳過程中發生錯誤，請檢查檔案格式。");
        } finally { setIsUploading(false); }
      }
    });
  };

  // 📊 抓取學生成績紀錄
  useEffect(() => {
    if (activeTab === 'reports') {
      const fetchRecords = async () => {
        setIsLoadingRecords(true);
        try {
          // 抓取 records 集合，並依照分數由高到低排序
          const q = query(collection(db, "records"), orderBy("total_score", "desc"));
          const querySnapshot = await getDocs(q);
          const fetchedRecords = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // 轉換日期格式
            date: new Date(doc.data().submitted_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          }));
          setRecords(fetchedRecords);
        } catch (error) {
          console.error("抓取成績失敗", error);
        } finally {
          setIsLoadingRecords(false);
        }
      };
      fetchRecords();
    }
  }, [activeTab]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👨‍🏫 教師管理後台</h2>

      {/* 頁籤切換按鈕 */}
      <div style={styles.tabContainer}>
        <button 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'reports' ? '#3498db' : '#ecf0f1', color: activeTab === 'reports' ? 'white' : '#333' }}
          onClick={() => setActiveTab('reports')}
        >
          📊 班級成績排行榜
        </button>
        <button 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'upload' ? '#3498db' : '#ecf0f1', color: activeTab === 'upload' ? 'white' : '#333' }}
          onClick={() => setActiveTab('upload')}
        >
          📥 匯入新題庫
        </button>
      </div>
      
      {/* 區塊 1：班級成績與圖表 */}
      {activeTab === 'reports' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏆 學生測驗成績</h3>
          
          {isLoadingRecords ? (
            <p>資料載入中...</p>
          ) : records.length === 0 ? (
            <p>目前還沒有學生完成測驗喔！</p>
          ) : (
            <>
              {/* 圖表區 (使用 Recharts) */}
              <div style={{ width: '100%', height: 300, marginBottom: '40px' }}>
                <ResponsiveContainer>
                  <BarChart data={records} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="student_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_score" name="總分" fill="#8884d8" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 排行榜表格 */}
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>排名</th>
                    <th style={styles.th}>學生姓名</th>
                    <th style={styles.th}>獲得分數</th>
                    <th style={styles.th}>賺取金幣</th>
                    <th style={styles.th}>交卷時間</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id} style={index % 2 === 0 ? {backgroundColor: '#f9f9f9'} : {}}>
                      <td style={styles.td}>
                        {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : index + 1}
                      </td>
                      <td style={styles.td}>{record.student_name}</td>
                      <td style={styles.td}><strong>{record.total_score}</strong></td>
                      <td style={{...styles.td, color: '#f39c12'}}>💰 {record.coins_earned}</td>
                      <td style={styles.td}>{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* 區塊 2：匯入題庫 */}
      {activeTab === 'upload' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📥 批次匯入題庫 (CSV)</h3>
          <p style={styles.desc}>您可以先下載空白範本，依照格式填寫完畢後再進行上傳。</p>
          <button onClick={handleDownloadTemplate} style={styles.downloadBtn}>📄 下載 CSV 空白範本</button>
          <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} style={styles.fileInput} />
          <button onClick={handleUpload} disabled={isUploading} style={{...styles.button, backgroundColor: isUploading ? '#95a5a6' : '#27ae60'}}>
            {isUploading ? "上傳中..." : "開始匯入題庫"}
          </button>
          {message && <p style={styles.message}>{message}</p>}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif' },
  title: { fontSize: '2rem', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tabBtn: { padding: '10px 20px', fontSize: '1.1rem', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 'bold' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '0 15px 15px 15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '1.5rem', color: '#34495e', marginTop: 0 },
  desc: { color: '#7f8c8d', marginBottom: '20px' },
  downloadBtn: { display: 'block', marginBottom: '20px', padding: '10px 20px', fontSize: '1rem', color: '#3498db', backgroundColor: '#ebf5fb', border: '1px solid #3498db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  fileInput: { display: 'block', width: '100%', padding: '10px', marginBottom: '20px', border: '1px dashed #bdc3c7', borderRadius: '5px' },
  button: { padding: '12px 25px', fontSize: '1.1rem', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  message: { marginTop: '20px', fontSize: '1.1rem', fontWeight: 'bold', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { backgroundColor: '#2c3e50', color: 'white', padding: '12px', textAlign: 'left', border: '1px solid #ecf0f1' },
  td: { padding: '12px', border: '1px solid #ecf0f1', color: '#34495e' }
};

export default TeacherDashboard;