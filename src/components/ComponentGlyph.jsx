import { useEffect, useState } from 'react';
import { loadStrokes } from '../utils/strokeData';

// 用教育部標準字體的筆畫外框畫字：range 範圍內的筆畫（共同部件）塗藍色，其他筆畫（不同的部件）塗紅色
export const SHARED_COLOR = '#2f6fb5';
export const DIFF_COLOR = '#c0392b';

const ComponentGlyph = ({ char, range, fontFamily }) => {
  const [loaded, setLoaded] = useState({ char: null, strokes: null });
  const strokes = loaded.char === char ? loaded.strokes : undefined;

  useEffect(() => {
    let cancelled = false;
    loadStrokes(char).then((data) => { if (!cancelled) setLoaded({ char, strokes: data }); });
    return () => { cancelled = true; };
  }, [char]);

  if (!strokes) {
    return (
      <span style={{ fontFamily, fontWeight: 300, color: '#2c3e50', fontSize: '2.2em', lineHeight: 1, visibility: strokes === undefined ? 'hidden' : 'visible' }}>
        {char}
      </span>
    );
  }

  return (
    <svg viewBox="0 0 2048 2048" style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label={char}>
      {strokes.map((s, i) => (
        <path key={i} d={s.d} fill={range && i >= range[0] && i <= range[1] ? SHARED_COLOR : DIFF_COLOR} />
      ))}
    </svg>
  );
};

export default ComponentGlyph;
