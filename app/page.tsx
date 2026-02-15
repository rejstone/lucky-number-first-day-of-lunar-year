'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_RESULTS, LotteryResults } from '@/lib/types';

type PrizeKey = keyof LotteryResults;

const META: Record<PrizeKey, { label: string; max: number; digits: number }> = {
  consolation: { label: 'Giải khuyến khích', max: 15, digits: 3 },
  third: { label: 'Giải ba', max: 5, digits: 4 },
  second: { label: 'Giải nhì', max: 3, digits: 4 },
  first: { label: 'Giải nhất', max: 1, digits: 4 },
  special: { label: 'Giải đặc biệt', max: 1, digits: 4 }
};

const ORDER: PrizeKey[] = ['consolation', 'third', 'second', 'first', 'special'];
const TOAST_KEYS: PrizeKey[] = ['third', 'second', 'first', 'special'];
const LAST3_DUPLICATE_PREFIX = '3 số cuối';

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
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeResults = (raw: unknown): LotteryResults => {
    const record = (raw ?? {}) as Record<string, unknown>;
    const next = { ...EMPTY_RESULTS };

    ORDER.forEach((key) => {
      const items = Array.isArray(record[key]) ? record[key] : [];
      next[key] = items
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0)
        .slice(0, META[key].max);
    });

    return next;
  };

  useEffect(() => {
    void fetch('/api/results')
      .then(async (r) => {
        const data = normalizeResults(await r.json());
        setResults(data);
      })
      .catch(() => setMessage('Không thể tải dữ liệu đã lưu.'));

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
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
  const visiblePrizeKeys = useMemo(
    () => ORDER.filter((key) => canInput[key] || results[key].length > 0),
    [canInput, results]
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

  const showValidationToast = (key: PrizeKey, text: string) => {
    const isLast3DuplicateError = text.startsWith(LAST3_DUPLICATE_PREFIX);
    if (!isLast3DuplicateError && !TOAST_KEYS.includes(key)) {
      return;
    }

    setToastMessage(text);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 4200);
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

    const last3 = value.slice(-3);
    const conflictedPrize = ORDER.find((prizeKey) =>
      (results[prizeKey] ?? []).some((existing) => {
        const normalizedExisting = String(existing ?? '');
        if (prizeKey === key && normalizedExisting === value) {
          return false;
        }
        return normalizedExisting.slice(-3) === last3;
      })
    );
    if (conflictedPrize) {
      return `3 số cuối (${last3}) trùng với ${META[conflictedPrize].label}.`;
    }

    return null;
  };

  const onSubmit = async (e: FormEvent, key: PrizeKey) => {
    e.preventDefault();
    setMessage('');

    if (!canInput[key]) {
      const text = 'Vui lòng nhập đúng thứ tự các nhóm giải.';
      setMessage(text);
      showValidationToast(key, text);
      return;
    }

    const value = inputs[key].trim();
    const error = validateEntry(key, value);

    if (error) {
      setMessage(error);
      showValidationToast(key, error);
      return;
    }

    if (results[key].length >= META[key].max) {
      const text = `${META[key].label} đã đủ số lượng.`;
      setMessage(text);
      showValidationToast(key, text);
      return;
    }

    const next = { ...results, [key]: [...results[key], value] };

    try {
      await saveResults(next);
      setResults(next);
      setInputs((prev) => ({ ...prev, [key]: '' }));
      setMessage(`Đã lưu ${value} cho ${META[key].label}.`);
      setToastMessage('');
    } catch {
      const text = 'Không thể lưu dữ liệu vào file.';
      setMessage(text);
      showValidationToast(key, text);
    }
  };

  return (
    <main className="page">
      <aside className="sidebar">
        <h1>🎋 Xổ Số Tết</h1>
        <p className="subtitle">Quay số từ 0000 - 2999</p>

        {ORDER.map((key) => (
          <section className="input-card" key={key}>
            <h2>
              {META[key].label} ({META[key].label === 'Giải khuyến khích' ? `${results[key].length * 3}/${META[key].max * 3}` : `${results[key].length}/${META[key].max}`})
            </h2>
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
        <div className="results-layout">
          {visiblePrizeKeys.map((key) => {
            const isSinglePrize = META[key].max === 1;
            const isHighlightPrize = key === 'second' || isSinglePrize;

            return (
              <article
                className={`result-block prize-${key} ${key === 'consolation' ? 'is-consolation' : ''} ${isHighlightPrize ? 'is-single' : ''}`}
                key={key}
              >
                <div className="result-head">
                  <h3>{META[key].label}</h3>
                  <span className="result-count">
                    {results[key].length}/{META[key].max}
                  </span>
                </div>
                {isSinglePrize ? (
                  <div className="single-number-wrap">
                    {results[key].length === 0 ? (
                      <p className="empty-state">Chưa có kết quả</p>
                    ) : (
                      <p className="single-number">{results[key][0]}</p>
                    )}
                  </div>
                ) : key === 'second' ? (
                  <ul className="single-list">
                    {results[key].length === 0 ? (
                      <li className="empty-state">Chưa có kết quả</li>
                    ) : (
                      results[key].map((n) => (
                        <li className="single-chip" key={n}>
                          {n}
                        </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <ul className="number-grid">
                    {results[key].length === 0 ? (
                      <li className="empty-state">Chưa có kết quả</li>
                    ) : (
                      results[key].map((n) => <li key={n}>{n}</li>)
                    )}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>
      {toastMessage && <div className="toast-error">{toastMessage}</div>}
    </main>
  );
}
