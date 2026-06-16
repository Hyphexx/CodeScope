export default function LanguageChart({ stats = [] }) {
  if (!stats.length) {
    return <p className="muted">No language data available.</p>;
  }

  return (
    <div className="language-chart">
      {stats.map((item) => (
        <div className="language-row" key={item.language}>
          <div className="language-meta">
            <span>{item.language}</span>
            <strong>{item.percentage}%</strong>
          </div>
          <div className="language-track">
            <div
              className="language-fill"
              style={{ width: `${Math.max(item.percentage, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
