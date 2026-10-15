import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Terminal, TerminalService } from '@core/config/terminal.service';

@Component({
  selector: 'app-terminal-setup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './terminal-setup.component.html',
  styleUrls: ['./terminal-setup.component.css'],
})
export class TerminalSetupComponent implements OnInit {
  readonly terminals = signal<Terminal[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly newTerminalName = signal('');

  constructor(
    private readonly terminalService: TerminalService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTerminals();
  }

  selectTerminal(terminal: Terminal): void {
    this.terminalService.setTerminalId(terminal.id);
    this.router.navigate(['/sales']);
  }

  registerTerminal(): void {
    const name = this.newTerminalName().trim();

    if (!name) {
      this.error.set('Captura un nombre para la terminal');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.terminalService.register({ name }).subscribe({
      next: (terminal) => {
        this.terminalService.setTerminalId(terminal.id);
        this.saving.set(false);

        this.router.navigate(['/sales']);
      },

      error: (error) => {
        console.error('Error registrando terminal', error);

        this.error.set('No fue posible registrar la terminal.');

        this.saving.set(false);
      },
    });
  }

  private loadTerminals(): void {
    this.loading.set(true);
    this.error.set('');

    this.terminalService.findAll().subscribe({
      next: (terminals) => {
        this.terminals.set(terminals);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error cargando terminales', error);

        this.error.set('No fue posible consultar las terminales.');

        this.loading.set(false);
      },
    });
  }
}
