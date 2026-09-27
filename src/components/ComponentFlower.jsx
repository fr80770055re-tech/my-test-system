import ComponentGlyph, { SHARED_COLOR, DIFF_COLOR } from './ComponentGlyph';

// 部件花瓣：花心是共同部件（例如「青」），花瓣是含有這個部件的字（晴、清、請…），
// 每個字的共同部件塗藍、不同的部件塗紅，讓學生一眼看出「部件＋部件＝新字」。
// 配色與方框取自 DOTOWN 粉紅小花的像素畫風；座標用百分比，任何螢幕寬度都等比例縮放。
const PETAL_RADIUS = 35;

const ComponentFlower = ({ keyChar, keyStrokeCount, petals, fontFamily }) => (
  <div style={styles.wrap}>
    <div style={styles.flower}>
      {petals.map((p, i) => {
        const angle = (i / petals.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <div
            key={`${p.char}-${i}`}
            style={{
              ...styles.petal,
              left: `${50 + PETAL_RADIUS * Math.cos(angle)}%`,
              top: `${50 + PETAL_RADIUS * Math.sin(angle)}%`,
              ...(p.highlight ? styles.petalHighlight : null),
            }}
          >
            <div style={styles.glyphBox}>
              {p.hidden ? <span style={styles.question}>？</span> : <ComponentGlyph char={p.char} range={p.range} fontFamily={fontFamily} />}
            </div>
            <div style={styles.bopomofo}>{p.label}</div>
          </div>
        );
      })}
      <div style={styles.center}>
        <div style={styles.centerGlyph}>
          <ComponentGlyph char={keyChar} range={[0, keyStrokeCount - 1]} fontFamily={fontFamily} />
        </div>
      </div>
    </div>
    <div style={styles.stem}>
      <div style={{ ...styles.leaf, top: '10px', right: '100%' }} />
      <div style={{ ...styles.leaf, top: '30px', left: '100%' }} />
    </div>
    <div style={styles.legend}>
      <span><span style={{ ...styles.dot, backgroundColor: SHARED_COLOR }} />共同部件「{keyChar}」</span>
      <span><span style={{ ...styles.dot, backgroundColor: DIFF_COLOR }} />不同的部件</span>
    </div>
  </div>
);

const styles = {
  wrap: { width: 'min(360px, 100%)', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  flower: { position: 'relative', width: '100%', aspectRatio: '1 / 1' },
  petal: {
    position: 'absolute', transform: 'translate(-50%, -50%)', width: '24%', padding: '4px 2px 2px', boxSizing: 'border-box',
    backgroundColor: '#f7a8c8', border: '3px solid #4a4a4a', boxShadow: '3px 3px 0 #4a4a4a', textAlign: 'center',
  },
  petalHighlight: { backgroundColor: '#fff3a3', borderColor: '#c0392b' },
  glyphBox: { width: '78%', aspectRatio: '1 / 1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  question: { fontSize: 'clamp(1.6rem, 7vw, 2.4rem)', color: '#c0392b', fontWeight: 'bold' },
  bopomofo: { fontSize: 'clamp(0.7rem, 3vw, 0.95rem)', color: '#2c3e50', marginTop: '2px', whiteSpace: 'nowrap' },
  center: {
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '30%', aspectRatio: '1 / 1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffd84d', border: '4px solid #4a4a4a', boxShadow: '3px 3px 0 #4a4a4a',
  },
  centerGlyph: { width: '80%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stem: { position: 'relative', width: '12px', height: '46px', backgroundColor: '#5cb85c', border: '3px solid #4a4a4a', marginTop: '-10px' },
  leaf: { position: 'absolute', width: '24px', height: '12px', backgroundColor: '#7ed07e', border: '3px solid #4a4a4a' },
  legend: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px', marginTop: '10px', fontSize: '0.95rem', color: '#4a4a4a' },
  dot: { display: 'inline-block', width: '12px', height: '12px', marginRight: '5px', verticalAlign: 'middle', border: '2px solid #4a4a4a' },
};

export default ComponentFlower;
