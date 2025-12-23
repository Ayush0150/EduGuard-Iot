import { TtlStore } from "./ttlStore.js";

const CAPTCHA_TTL_MS = 10 * 60 * 1000; // 10 min

export class CaptchaStore {
  constructor() {
    this.store = new TtlStore({ ttlMs: CAPTCHA_TTL_MS });
  }

  createChallenge() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const token = this.store.createToken();
    this.store.set(token, String(a + b));
    return { token, question: `${a} + ${b} = ?` };
  }

  verify({ token, answer }) {
    if (!token) return false;
    const expected = this.store.get(token);
    if (!expected) return false;
    const ok = String(answer ?? "").trim() === String(expected);
    if (ok) this.store.delete(token);
    return ok;
  }
}

export const captchaStore = new CaptchaStore();
