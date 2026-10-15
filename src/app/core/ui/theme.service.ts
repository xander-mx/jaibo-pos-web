import { Injectable, signal } from '@angular/core';

export type JaiboTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'JAIBO_THEME';

  readonly theme = signal<JaiboTheme>('light');

  initialize(): void {
    const stored = localStorage.getItem(this.storageKey) as JaiboTheme | null;

    if (stored === 'light' || stored === 'dark') {
      this.applyTheme(stored);
      return;
    }

    /*
     * Primera visita:
     * respetamos la preferencia
     * del dispositivo.
     */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  toggle(): void {
    this.applyTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: JaiboTheme): void {
    this.applyTheme(theme);
  }

  private applyTheme(theme: JaiboTheme): void {
    this.theme.set(theme);

    document.documentElement.setAttribute('data-theme', theme);

    localStorage.setItem(this.storageKey, theme);
  }
}
