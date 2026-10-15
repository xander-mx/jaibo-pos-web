import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { User } from '@core/models/user';
import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showCreateForm = signal(false);

  readonly username = signal('');
  readonly password = signal('');
  readonly displayName = signal('');

  readonly role = signal<'ADMIN' | 'CASHIER'>('CASHIER');

  readonly creating = signal(false);
  readonly createError = signal('');
  readonly actionUserId = signal<string | null>(null);
  readonly actionError = signal('');
  readonly passwordUser = signal<User | null>(null);
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly passwordLoading = signal(false);
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');
  readonly deactivateTarget = signal<User | null>(null);

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  openCreateForm(): void {
    this.passwordSuccess.set('');
    this.username.set('');
    this.password.set('');
    this.displayName.set('');
    this.role.set('CASHIER');

    this.createError.set('');
    this.showCreateForm.set(true);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.createError.set('');
  }

  createUser(): void {
    const username = this.username().trim();

    const displayName = this.displayName().trim();

    const password = this.password();

    if (!username) {
      this.createError.set('Captura un usuario');
      return;
    }

    if (!displayName) {
      this.createError.set('Captura el nombre');
      return;
    }

    if (!password) {
      this.createError.set('Captura una contraseña');
      return;
    }

    this.creating.set(true);
    this.createError.set('');

    this.userService
      .create({
        username,
        password,
        displayName,
        role: this.role(),
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);

          this.loadUsers();
        },

        error: (error) => {
          console.error('Error creating user', error);

          this.createError.set(error?.error?.detail ?? 'No fue posible crear el usuario');

          this.creating.set(false);
        },
      });
  }

  activateUser(user: User): void {
    this.actionUserId.set(user.id);
    this.actionError.set('');

    this.userService.activate(user.id).subscribe({
      next: () => {
        this.actionUserId.set(null);
        this.loadUsers();
      },

      error: (error) => {
        console.error('Error activating user', error);

        this.actionError.set(error?.error?.detail ?? 'No fue posible activar el usuario');

        this.actionUserId.set(null);
      },
    });
  }

  requestDeactivateUser(user: User): void {
    this.deactivateTarget.set(user);
    this.actionError.set('');
  }

  cancelDeactivateUser(): void {
    this.deactivateTarget.set(null);
  }

  confirmDeactivateUser(): void {
    const user = this.deactivateTarget();

    if (!user) {
      return;
    }

    this.actionUserId.set(user.id);
    this.actionError.set('');

    this.userService.deactivate(user.id).subscribe({
      next: () => {
        this.actionUserId.set(null);
        this.deactivateTarget.set(null);

        this.loadUsers();
      },

      error: (error) => {
        console.error('Error deactivating user', error);

        this.actionError.set(error?.error?.detail ?? 'No fue posible desactivar el usuario');

        this.actionUserId.set(null);
      },
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    this.userService.findAll().subscribe({
      next: (users) => {
        this.users.set(users);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading users', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar los usuarios');

        this.loading.set(false);
      },
    });
  }

  startPasswordReset(user: User): void {
    this.passwordUser.set(user);
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordError.set('');
    this.passwordSuccess.set('');
  }

  cancelPasswordReset(): void {
    this.passwordUser.set(null);
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordError.set('');
  }

  resetPassword(): void {
    const user = this.passwordUser();

    if (!user) {
      return;
    }

    const password = this.newPassword();
    const confirmation = this.confirmPassword();

    if (!password) {
      this.passwordError.set('Captura la nueva contraseña');
      return;
    }

    if (password !== confirmation) {
      this.passwordError.set('Las contraseñas no coinciden');
      return;
    }

    this.passwordLoading.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    this.userService
      .resetPassword(user.id, {
        newPassword: password,
      })
      .subscribe({
        next: () => {
          this.passwordLoading.set(false);

          const message = `Contraseña restablecida para ${user.displayName}`;

          this.passwordSuccess.set(message);
          this.passwordUser.set(null);
          this.newPassword.set('');
          this.confirmPassword.set('');

          setTimeout(() => {
            if (this.passwordSuccess() === message) {
              this.passwordSuccess.set('');
            }
          }, 3000);
        },

        error: (error) => {
          console.error('Error resetting password', error);

          this.passwordError.set(
            error?.error?.detail ?? 'No fue posible restablecer la contraseña',
          );

          this.passwordLoading.set(false);
        },
      });
  }
}
