// 「造詞」統一用綠色標籤呈現，讓學生一眼分辨「這是用這個字組成的詞」；目標字用紅色，空格用虛線框。
export const WORD_COLOR = '#2e7d32';

const WordChip = ({ word, target, fontFamily, large = false }) => (
  <span style={{ ...styles.chip, fontSize: large ? 'clamp(1.3rem, 5.5vw, 1.8rem)' : 'clamp(1.05rem, 4.2vw, 1.3rem)' }}>
    <span style={styles.tag}>造詞</span>
    <span style={{ fontFamily }}>
      {[...word].map((ch, i) => {
        if (ch === '＿') return <span key={i} style={styles.blank} />;
        return <span key={i} style={ch === target ? styles.target : undefined}>{ch}</span>;
      })}
    </span>
  </span>
);

const styles = {
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px 2px 4px', margin: '3px',
    backgroundColor: '#e6f4e6', border: `2px solid ${WORD_COLOR}`, color: '#1b4d1e', whiteSpace: 'nowrap', verticalAlign: 'middle',
  },
  tag: { backgroundColor: WORD_COLOR, color: '#fff', fontSize: '0.7em', padding: '1px 5px', fontWeight: 'bold' },
  target: { color: '#c0392b', fontWeight: 'bold' },
  blank: { display: 'inline-block', width: '1em', height: '1em', border: `2px dashed ${WORD_COLOR}`, verticalAlign: 'middle', margin: '0 2px' },
};

export default WordChip;
