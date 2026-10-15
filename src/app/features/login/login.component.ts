import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { Router } from '@angular/router';
import { TerminalService } from '@core/config/terminal.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  readonly username = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly terminalService: TerminalService,
    private readonly router: Router,
  ) {}

  login(): void {
    const username = this.username().trim();

    const password = this.password();

    if (!username || !password) {
      this.error.set('Captura usuario y contraseña');

      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(username, password).subscribe({
      next: () => {
        const terminalId = this.terminalService.getTerminalId();

        if (!terminalId) {
          this.loading.set(false);
          this.router.navigate(['/terminal-setup']);
          return;
        }

        this.terminalService.getCurrent().subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/sales']);
          },

          error: (error) => {
            console.warn('La terminal configurada ya no es válida', error);

            this.terminalService.clear();
            this.loading.set(false);

            this.router.navigate(['/terminal-setup']);
          },
        });
      },

      error: (error) => {
        console.error('Error de login', error);

        if (error.status === 401) {
          this.error.set(
            'No fue posible iniciar sesión. Verifica tus datos o consulta con el administrador si tu usuario fue desactivado.',
          );
        } else {
          this.error.set('No fue posible conectarse al sistema.');
        }

        this.loading.set(false);
      },
    });
  }
}
