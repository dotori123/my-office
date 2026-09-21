export const fmtWon = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** 1 → '1일', 0.5 → '0.5일', 0.25 → '0.25일' */
export const fmtDays = (n: number) => `${parseFloat(n.toFixed(2))}일`

export const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100))

export const uid = () => Math.random().toString(36).slice(2, 10)
