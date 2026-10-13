import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NoticeService {
  notice = signal<{ text: string; type: 'ok' | 'error' } | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  ok(text: string) { this.show(text, 'ok'); }
  error(text: string) { this.show(text, 'error'); }

  private show(text: string, type: 'ok' | 'error') {
    this.notice.set({ text, type });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.notice.set(null), 4500);
  }
}
