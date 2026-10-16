import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Terminal, TerminalService } from '@core/config/terminal.service';
import { Branch, BranchService } from '@core/config/branch.service';

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
  readonly branches = signal<Branch[]>([]);
  readonly selectedBranchId = signal<string | null>(null);

  constructor(
    private readonly terminalService: TerminalService,
    private readonly branchService: BranchService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadTerminals();
  }

  selectTerminal(terminal: Terminal): void {
    this.terminalService.setTerminalId(terminal.id);
    this.router.navigate(['/sales']);
  }

  registerTerminal(): void {
    const name = this.newTerminalName().trim();
    const branchId = this.selectedBranchId();

    if (!name) {
      this.error.set('Captura un nombre para la terminal');
      return;
    }

    if (!branchId) {
      this.error.set('Selecciona una sucursal');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.terminalService
      .register({
        name,
        branchId,
      })
      .subscribe({
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

  private loadBranches(): void {
    this.branchService.findAll().subscribe({
      next: (branches) => {
        this.branches.set(branches);

        if (branches.length > 0 && !this.selectedBranchId()) {
          this.selectedBranchId.set(branches[0].id);
        }
      },

      error: (error) => {
        console.error('Error cargando sucursales', error);
        this.error.set('No fue posible consultar las sucursales.');
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
