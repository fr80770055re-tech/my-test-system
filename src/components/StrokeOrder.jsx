import { useEffect, useState } from 'react';

// 依教育部標準筆順逐筆描寫的動畫。資料由 scripts/build-strokes.js 產生在 public/strokes/。
// 每一筆：d 是筆畫外框（裁切範圍），t 是中心線軌跡 [[x, y, size], ...]，座標系 2048×2048。
const GRID = 2048;

function trackLength(t) {
  let len = 0;
  for (let i = 1; i < t.length; i++) len += Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]);
  return len;
}

const StrokeOrder = ({ char, size = 180, fontFamily }) => {
  const [loaded, setLoaded] = useState({ char: null, strokes: null });
  const [playKey, setPlayKey] = useState(0);
  const strokes = loaded.char === char ? loaded.strokes : undefined;

  useEffect(() => {
    let cancelled = false;
    const hex = char.codePointAt(0).toString(16);
    fetch(`${import.meta.env.BASE_URL}strokes/${hex}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => { if (!cancelled) setLoaded({ char, strokes: data }); });
    return () => { cancelled = true; };
  }, [char]);

  const box = { width: size, height: size, flexShrink: 0 };

  if (strokes === undefined) return <div style={box} />;

  if (!strokes) {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * 0.7, lineHeight: 1, fontFamily, fontWeight: 300, color: '#2c3e50' }}>{char}</div>
        <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: 4 }}>此字暫無標準筆順</div>
      </div>
    );
  }

  const timeline = [];
  let delay = 0;
  for (const s of strokes) {
    const duration = Math.max(0.3, trackLength(s.t) / 1400);
    timeline.push({ ...s, delay, duration, width: Math.max(...s.t.map((p) => p[2] || 0), 120) * 2.2 });
    delay += duration + 0.15;
  }

  return (
    <div
      style={{ ...box, position: 'relative', cursor: 'pointer' }}
      title="點我重播筆順"
      onClick={(e) => { e.stopPropagation(); setPlayKey((k) => k + 1); }}
    >
      <style>{`@keyframes strokeDraw { to { stroke-dashoffset: 0; } }`}</style>
      <svg key={playKey} viewBox={`0 0 ${GRID} ${GRID}`} width={size} height={size} style={{ background: '#fff', border: '3px solid #c0392b' }}>
        {/* 田字格 */}
        <g stroke="#e8a9a1" strokeWidth="10" strokeDasharray="40 30">
          <line x1={GRID / 2} y1="0" x2={GRID / 2} y2={GRID} />
          <line x1="0" y1={GRID / 2} x2={GRID} y2={GRID / 2} />
        </g>
        <defs>
          {timeline.map((s, i) => (
            <clipPath key={i} id={`stroke-clip-${playKey}-${i}`}><path d={s.d} /></clipPath>
          ))}
        </defs>
        {/* 淡灰色底字，讓學生先看到整個字的樣子 */}
        {timeline.map((s, i) => <path key={`ghost-${i}`} d={s.d} fill="#dcdcdc" />)}
        {timeline.map((s, i) => (
          <polyline
            key={`draw-${i}`}
            points={(s.t.length > 1 ? s.t : [s.t[0], [s.t[0][0] + 1, s.t[0][1] + 1]]).map((p) => `${p[0]},${p[1]}`).join(' ')}
            clipPath={`url(#stroke-clip-${playKey}-${i})`}
            fill="none"
            stroke="#2c3e50"
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: `strokeDraw ${s.duration}s linear ${s.delay}s forwards` }}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', right: 4, bottom: 2, fontSize: '0.75rem', color: '#95a5a6' }}>▶ 重播</div>
    </div>
  );
};

export default StrokeOrder;
