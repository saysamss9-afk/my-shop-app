export const parseTimestamp = (raw: any, fallback = Date.now()): number => {
  if (raw === null || raw === undefined) return fallback;

  if (typeof raw === 'number') {
    if (isNaN(raw) || raw <= 0) return fallback;
    return raw < 1e11 ? Math.floor(raw * 1000) : Math.floor(raw);
  }

  if (typeof raw === 'string') {
    const parsedNum = Number(raw);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      return parsedNum < 1e11 ? Math.floor(parsedNum * 1000) : Math.floor(parsedNum);
    }
    const parsedDate = Date.parse(raw);
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }
    return fallback;
  }

  if (typeof raw === 'object') {
    if (typeof raw.toMillis === 'function') {
      try {
        const ms = raw.toMillis();
        if (typeof ms === 'number' && ms > 0) return ms < 1e11 ? Math.floor(ms * 1000) : Math.floor(ms);
      } catch (e) {}
    }
    if (typeof raw.toDate === 'function') {
      try {
        const d = raw.toDate();
        if (d && typeof d.getTime === 'function') return d.getTime();
      } catch (e) {}
    }
    if (raw.seconds !== undefined && raw.seconds !== null) {
      const sec = Number(raw.seconds);
      if (!isNaN(sec) && sec > 0) {
        const nano = Number(raw.nanoseconds || 0);
        return Math.floor(sec * 1000 + (isNaN(nano) ? 0 : nano / 1000000));
      }
    }
    if (raw._seconds !== undefined && raw._seconds !== null) {
      const sec = Number(raw._seconds);
      if (!isNaN(sec) && sec > 0) {
        const nano = Number(raw._nanoseconds || 0);
        return Math.floor(sec * 1000 + (isNaN(nano) ? 0 : nano / 1000000));
      }
    }
  }

  return fallback;
};
