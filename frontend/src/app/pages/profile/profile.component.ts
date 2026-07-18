import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Profile } from '../../core/api.service';
import { ShellComponent } from '../../shared/shell.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ShellComponent, FormsModule, DatePipe],
  template: `
    <app-shell title="Profilo" subtitle="Preferenze notifiche e stato sync.">
      @if (loading()) {
        <p class="state">Caricamento profilo…</p>
      } @else if (error()) {
        <p class="state error">{{ error() }}</p>
      } @else if (profile()) {
        @let p = profile()!;
        <section class="card identity">
          <div class="who">
            @if (p.avatarUrl) {
              <img [src]="p.avatarUrl" alt="" class="avatar" />
            }
            <div>
              <h2>{{ p.displayName || 'Utente Spotify' }}</h2>
              <p>{{ p.followedArtistsCount }} artisti seguiti</p>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Notifiche email</h3>
          <label class="row">
            <input
              type="checkbox"
              [ngModel]="p.notificationsEnabled"
              (ngModelChange)="onEnabled($event)"
            />
            <span>Attiva notifiche email</span>
          </label>

          <label class="field">
            <span>Email</span>
            <input
              type="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              (blur)="saveEmail()"
              placeholder="nome@email.com"
            />
          </label>

          <fieldset class="modes" [disabled]="!p.notificationsEnabled">
            <legend>Modalità</legend>
            <label>
              <input
                type="radio"
                name="mode"
                value="per_release"
                [ngModel]="p.notificationMode"
                (ngModelChange)="onMode($event)"
              />
              Per nuova uscita
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="digest"
                [ngModel]="p.notificationMode"
                (ngModelChange)="onMode($event)"
              />
              Digest giornaliero
            </label>
          </fieldset>
          @if (saved()) {
            <p class="ok">Preferenze salvate.</p>
          }
        </section>

        <section class="card">
          <h3>Ultima sincronizzazione</h3>
          @if (p.lastSyncAt) {
            <p>
              {{ p.lastSyncAt | date: 'd MMM y, HH:mm' : undefined : 'it-IT' }}
              ·
              {{ p.lastSyncStatus === 'success' ? 'riuscita' : p.lastSyncStatus }}
            </p>
          } @else {
            <p>Nessuna sync completata ancora.</p>
          }
        </section>

        <button type="button" class="logout" (click)="logout()">Esci</button>
      }
    </app-shell>
  `,
  styles: [
    `
      .card {
        padding: 1.1rem 0;
        border-bottom: 1px solid color-mix(in oklab, var(--ink) 10%, transparent);
      }
      .card h2,
      .card h3 {
        font-family: var(--font-display);
        margin: 0 0 0.75rem;
        letter-spacing: -0.02em;
      }
      .who {
        display: flex;
        gap: 0.9rem;
        align-items: center;
      }
      .avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
      }
      .who p {
        margin: 0.2rem 0 0;
        color: var(--muted);
      }
      .row,
      .modes label {
        display: flex;
        gap: 0.55rem;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin: 0.9rem 0;
      }
      .field span {
        font-size: 0.85rem;
        color: var(--muted);
      }
      .field input {
        border: 1px solid color-mix(in oklab, var(--ink) 16%, transparent);
        border-radius: 0.45rem;
        padding: 0.65rem 0.75rem;
        font: inherit;
        background: color-mix(in oklab, var(--bg) 70%, white);
        color: var(--ink);
      }
      .modes {
        border: none;
        padding: 0;
        margin: 0.5rem 0 0;
      }
      .modes legend {
        font-size: 0.85rem;
        color: var(--muted);
        margin-bottom: 0.5rem;
      }
      .ok {
        color: var(--accent-2);
        font-size: 0.9rem;
      }
      .logout {
        margin-top: 1.5rem;
        border: 1px solid color-mix(in oklab, var(--ink) 18%, transparent);
        background: transparent;
        color: var(--ink);
        border-radius: 0.45rem;
        padding: 0.65rem 1rem;
        font: inherit;
        cursor: pointer;
      }
      .state {
        color: var(--muted);
      }
      .state.error {
        color: #c44b4b;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly profile = signal<Profile | null>(null);
  readonly email = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  ngOnInit(): void {
    this.api.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.email.set(p.notificationEmail || p.email || '');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Profilo non disponibile.');
      },
    });
  }

  onEnabled(enabled: boolean): void {
    this.patch({ notificationsEnabled: enabled });
  }

  onMode(mode: 'per_release' | 'digest'): void {
    this.patch({ notificationMode: mode });
  }

  saveEmail(): void {
    this.patch({ notificationEmail: this.email() });
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  private patch(body: {
    notificationsEnabled?: boolean;
    notificationMode?: 'per_release' | 'digest';
    notificationEmail?: string;
  }): void {
    this.api.updatePreferences(body).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.email.set(p.notificationEmail || '');
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Salvataggio non riuscito.');
      },
    });
  }
}
