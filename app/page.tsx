'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EMPTY_RESULTS, LotteryResults } from '@/lib/types';

type PrizeKey = keyof LotteryResults;

const META: Record<PrizeKey, { label: string; max: number; digits: number }> = {
  consolation: { label: 'Giải khuyến khích', max: 45, digits: 3 },
  third: { label: 'Giải ba', max: 5, digits: 4 },
  second: { label: 'Giải nhì', max: 3, digits: 4 },
  first: { label: 'Giải nhất', max: 1, digits: 4 },
  special: { label: 'Giải đặc biệt', max: 1, digits: 4 }
};

const ORDER: PrizeKey[] = ['consolation', 'third', 'second', 'first', 'special'];

export default function HomePage() {
  const [results, setResults] = useState<LotteryResults>(EMPTY_RESULTS);
  const [inputs, setInputs] = useState<Record<PrizeKey, string>>({
    consolation: '',
    third: '',
    second: '',
    first: '',
    special: ''
  });
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    void fetch('/api/results')
      .then(async (r) => {
        const data = (await r.json()) as LotteryResults;
        setResults(data);
      })
      .catch(() => setMessage('Không thể tải dữ liệu đã lưu.'));
  }, []);

  const canInput = useMemo(
    () => ({
      consolation: true,
      third: results.consolation.length === META.consolation.max,
      second: results.third.length === META.third.max,
      first: results.second.length === META.second.max,
      special: results.first.length === META.first.max
    }),
    [results]
  );

  const saveResults = async (next: LotteryResults) => {
    const response = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });

    if (!response.ok) {
      throw new Error('Save failed');
    }
  };

  const validateEntry = (key: PrizeKey, value: string): string | null => {
    const { digits } = META[key];
    const re = digits === 3 ? /^\d{3}$/ : /^[0-2]\d{3}$/;

    if (!re.test(value)) {
      return digits === 3
        ? 'Giải khuyến khích phải là 3 chữ số (000-999).'
        : 'Giải ba/nhì/nhất/đặc biệt phải là 4 chữ số, số đầu từ 0-2.';
    }

    if (results[key].includes(value)) {
      return `Số ${value} đã tồn tại trong ${META[key].label}.`;
    }

    if (META[key].digits === 4 && results.consolation.includes(value.slice(1))) {
      return `3 số cuối (${value.slice(1)}) trùng với giải khuyến khích.`;
    }

    return null;
  };

  const onSubmit = async (e: FormEvent, key: PrizeKey) => {
    e.preventDefault();
    setMessage('');

    if (!canInput[key]) {
      setMessage('Vui lòng nhập đúng thứ tự các nhóm giải.');
      return;
    }

    const value = inputs[key].trim();
    const error = validateEntry(key, value);

    if (error) {
      setMessage(error);
      return;
    }

    if (results[key].length >= META[key].max) {
      setMessage(`${META[key].label} đã đủ số lượng.`);
      return;
    }

    const next = { ...results, [key]: [...results[key], value] };

    try {
      await saveResults(next);
      setResults(next);
      setInputs((prev) => ({ ...prev, [key]: '' }));
      setMessage(`Đã lưu ${value} cho ${META[key].label}.`);
    } catch {
      setMessage('Không thể lưu dữ liệu vào file.');
    }
  };

  return (
    <main className="page">
      <aside className="sidebar">
        <h1>🎋 Xổ Số Tết</h1>
        <p className="subtitle">Nhập số theo thứ tự giải để lưu an toàn.</p>

        {ORDER.map((key) => (
          <section className="input-card" key={key}>
            <h2>{META[key].label}</h2>
            <p>
              {results[key].length}/{META[key].max}
            </p>
            <form onSubmit={(e) => void onSubmit(e, key)}>
              <input
                value={inputs[key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value.replace(/\D/g, '') }))}
                maxLength={META[key].digits}
                placeholder={META[key].digits === 3 ? 'VD: 528' : 'VD: 1456'}
                disabled={!canInput[key] || results[key].length >= META[key].max}
              />
              <button type="submit" disabled={!canInput[key] || results[key].length >= META[key].max}>
                Lưu số
              </button>
            </form>
          </section>
        ))}

        {message && <p className="message">{message}</p>}
      </aside>

      <section className="board">
        <h2>Bảng kết quả quay số</h2>
        {ORDER.map((key) => (
          <article className="result-block" key={key}>
            <h3>{META[key].label}</h3>
            <ul className="number-grid">
              {results[key].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
