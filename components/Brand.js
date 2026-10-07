export default function Brand({ title, sub }) {
  return (
    <div className="auth-head">
      <div className="brandmark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 20.5v-8l5 3v-3l5 3v-3l3 1.8V7" />
          <path d="M3.5 20.5h17v-6" />
          <path d="M15.5 7h3" />
          <path d="M9.5 19l1.5 1.5 3-3.2" stroke="#F5B83D" />
        </svg>
      </div>
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  );
}
