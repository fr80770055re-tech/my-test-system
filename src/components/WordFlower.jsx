// 花瓣識字：花心是生字，花瓣是含有這個字的詞語。配色取自 DOTOWN 粉紅小花（plant_flower_pink_01），
// 方正粗框維持與商店角色一致的像素畫風。座標全用百分比，任何螢幕寬度都會等比例縮放。
const PETAL_RADIUS = 34;

const WordFlower = ({ center, petals, fontFamily, highlight = false }) => (
  <div style={styles.wrap}>
    <div style={styles.flower}>
      {petals.map((word, i) => {
        const angle = (i / petals.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <div
            key={`${word}-${i}`}
            style={{
              ...styles.petal,
              left: `${50 + PETAL_RADIUS * Math.cos(angle)}%`,
              top: `${50 + PETAL_RADIUS * Math.sin(angle)}%`,
              fontFamily,
              fontSize: word.length >= 4 ? 'clamp(0.9rem, 3.8vw, 1.25rem)' : 'clamp(1.05rem, 4.5vw, 1.5rem)',
            }}
          >
            {word}
          </div>
        );
      })}
      <div style={{ ...styles.center, fontFamily, backgroundColor: highlight ? '#fff3a3' : '#ffd84d' }}>{center}</div>
    </div>
    <div style={styles.stem}>
      <div style={{ ...styles.leaf, top: '10px', right: '100%' }} />
      <div style={{ ...styles.leaf, top: '30px', left: '100%' }} />
    </div>
  </div>
);

const styles = {
  wrap: { width: 'min(340px, 100%)', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  flower: { position: 'relative', width: '100%', aspectRatio: '1 / 1' },
  petal: {
    position: 'absolute', transform: 'translate(-50%, -50%)', minWidth: '28%', padding: '6px 8px', boxSizing: 'border-box',
    backgroundColor: '#f7a8c8', border: '3px solid #4a4a4a', boxShadow: '3px 3px 0 #4a4a4a',
    color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2,
  },
  center: {
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '30%', aspectRatio: '1 / 1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #4a4a4a', boxShadow: '3px 3px 0 #4a4a4a',
    fontSize: 'clamp(2.2rem, 11vw, 3.4rem)', fontWeight: 300, color: '#2c3e50',
  },
  stem: { position: 'relative', width: '12px', height: '56px', backgroundColor: '#5cb85c', border: '3px solid #4a4a4a', marginTop: '-10px' },
  leaf: { position: 'absolute', width: '24px', height: '12px', backgroundColor: '#7ed07e', border: '3px solid #4a4a4a' },
};

export default WordFlower;
