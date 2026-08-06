import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  submitting = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  submit(): void {
    if (!this.username || !this.password) {
      this.toastService.error('Enter your username and password.');
      return;
    }

    this.submitting.set(true);
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 401) {
          this.toastService.error('Invalid username or password.');
        } else if (err.status === 0) {
          this.toastService.error('Could not reach the server - it may be blocked (CORS) or unreachable. Check the browser console for details.');
        } else {
          this.toastService.error(`Login failed (HTTP ${err.status}). Check the browser console for details.`);
        }
      }
    });
  }
}
