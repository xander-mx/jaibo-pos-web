import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { TerminalService } from '@core/config/terminal.service';
import { RealtimeService } from '@core/realtime/realtime.service';
import { ThemeService } from '@core/ui/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('jaibo-pos-web');

  protected readonly menuOpen = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly terminalService: TerminalService,
    private readonly realtimeService: RealtimeService,
    private readonly router: Router,
    protected readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.initialize();

    const token = this.authService.getToken();

    const terminalId = this.terminalService.getTerminalId();

    if (!token || !terminalId) {
      return;
    }

    this.terminalService.getCurrent().subscribe({
      next: (terminal) => {
        this.realtimeService.connect(token, terminalId, terminal.branchId);
      },

      error: (error) => {
        console.error('Unable to initialize realtime connection', error);
      },
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.menuOpen.set(false);

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
