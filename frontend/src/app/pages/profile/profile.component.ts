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
    <app-shell
      title="Il tuo profilo"
      subtitle="Scegli come ricevere le novità e controlla quando abbiamo aggiornato il tuo catalogo."
    >
      @if (loading()) {
        <p class="state">Caricamento profilo…</p>
      } @else if (error()) {
        <p class="state error">{{ error() }}</p>
      } @else if (profile()) {
        @let p = profile()!;
        <div class="profile-grid">
          <section class="card identity">
            @if (p.avatarUrl) {
              <img [src]="p.avatarUrl" alt="" class="avatar" />
            } @else {
              <span class="avatar fallback" aria-hidden="true">
                {{ (p.displayName || 'U').charAt(0) }}
              </span>
            }
            <div class="identity-copy">
              <span class="section-label">Account Spotify</span>
              <h2>{{ p.displayName || 'Utente Spotify' }}</h2>
              <p><strong>{{ p.followedArtistsCount }}</strong> artisti nel radar</p>
            </div>
          </section>

          <section class="card preferences">
            <div class="card-head">
              <div>
                <span class="section-label">Avvisi</span>
                <h3>Notifiche email</h3>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  [ngModel]="p.notificationsEnabled"
                  (ngModelChange)="onEnabled($event)"
                />
                <span aria-hidden="true"></span>
                <b>{{ p.notificationsEnabled ? 'Attive' : 'Disattivate' }}</b>
              </label>
            </div>

            <label class="field">
              <span>Indirizzo email</span>
              <input
                type="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                (blur)="saveEmail()"
                placeholder="nome@email.com"
              />
            </label>

            <fieldset class="modes" [disabled]="!p.notificationsEnabled">
              <legend>Frequenza</legend>
              <label [class.selected]="p.notificationMode === 'per_release'">
                <input
                  type="radio"
                  name="mode"
                  value="per_release"
                  [ngModel]="p.notificationMode"
                  (ngModelChange)="onMode($event)"
                />
                <span>
                  <strong>Appena esce</strong>
                  <small>Una mail per ogni nuova uscita</small>
                </span>
              </label>
              <label [class.selected]="p.notificationMode === 'digest'">
                <input
                  type="radio"
                  name="mode"
                  value="digest"
                  [ngModel]="p.notificationMode"
                  (ngModelChange)="onMode($event)"
                />
                <span>
                  <strong>Riepilogo giornaliero</strong>
                  <small>Una sola mail con tutte le novità</small>
                </span>
              </label>
            </fieldset>
            @if (saved()) {
              <p class="ok">Salvato</p>
            }
          </section>

          <section class="card sync-card">
            <span class="section-label">Catalogo</span>
            <h3>Ultimo aggiornamento</h3>
            @if (p.lastSyncAt) {
              <p class="sync-time">
                {{ p.lastSyncAt | date: 'd MMM' : undefined : 'it-IT' }}
                <span>{{ p.lastSyncAt | date: 'HH:mm' : undefined : 'it-IT' }}</span>
              </p>
              <p class="sync-status">
                <i [class.ok-dot]="p.lastSyncStatus === 'success'"></i>
                {{ p.lastSyncStatus === 'success' ? 'Catalogo aggiornato' : p.lastSyncStatus }}
              </p>
            } @else {
              <p class="no-sync">Nessun aggiornamento completato.</p>
            }
          </section>
        </div>

        <button type="button" class="logout" (click)="logout()">Esci</button>
      }
    </app-shell>
  `,
  styles: [
    `
      .profile-grid {
        display: grid;
        grid-template-columns: 0.75fr 1.5fr;
        gap: 1rem;
      }
      .card {
        padding: clamp(1.25rem, 3vw, 2rem);
        border: 1px solid var(--line);
        background: color-mix(in srgb, var(--surface) 76%, transparent);
      }
      .card h2, .card h3 {
        font-family: var(--font-display);
        margin: 0;
        letter-spacing: -0.035em;
      }
      .identity {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 300px;
        color: var(--surface);
        background: var(--accent-2);
        border: 0;
      }
      .identity-copy {
        margin-top: 2rem;
      }
      .identity h2 {
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 0.95;
      }
      .identity p {
        margin: 0.8rem 0 0;
        color: rgba(255, 255, 255, 0.72);
      }
      .identity p strong {
        color: var(--surface);
        font-size: 1.2rem;
      }
      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(255, 255, 255, 0.7);
      }
      .fallback {
        display: grid;
        place-items: center;
        font-family: var(--font-display);
        font-size: 2rem;
        background: var(--accent);
      }
      .section-label {
        display: block;
        margin-bottom: 0.55rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.11em;
        text-transform: uppercase;
        opacity: 0.68;
      }
      .preferences {
        grid-row: span 2;
      }
      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .card-head h3, .sync-card h3 {
        font-size: 1.55rem;
      }
      .switch {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        gap: 0 0.55rem;
        cursor: pointer;
      }
      .switch input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .switch > span {
        width: 46px;
        height: 26px;
        padding: 3px;
        border-radius: 999px;
        background: var(--paper-deep);
        transition: background 180ms ease;
      }
      .switch > span::after {
        content: '';
        display: block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--surface);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
        transition: transform 180ms ease;
      }
      .switch input:checked + span {
        background: var(--olive);
      }
      .switch input:checked + span::after {
        transform: translateX(20px);
      }
      .switch b {
        font-size: 0.72rem;
        font-weight: 700;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        margin: 0 0 1.75rem;
      }
      .field span {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .field input {
        border: 0;
        border-bottom: 1px solid var(--ink);
        padding: 0.75rem 0;
        font: inherit;
        background: transparent;
        color: var(--ink);
      }
      .modes {
        border: none;
        padding: 0;
        margin: 0;
      }
      .modes legend {
        margin-bottom: 0.75rem;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .modes label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem;
        border: 1px solid var(--line);
        cursor: pointer;
      }
      .modes label + label {
        margin-top: 0.5rem;
      }
      .modes label.selected {
        border-color: var(--accent-2);
        background: color-mix(in srgb, var(--accent-2) 7%, transparent);
      }
      .modes label span {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .modes label strong {
        font-size: 0.86rem;
      }
      .modes label small {
        color: var(--muted);
      }
      .ok {
        color: var(--olive);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .sync-card {
        min-height: 180px;
      }
      .sync-time {
        margin: 1.35rem 0 0.4rem;
        font-family: var(--font-display);
        font-size: 2.7rem;
        line-height: 0.9;
        letter-spacing: -0.05em;
        text-transform: capitalize;
      }
      .sync-time span {
        color: var(--muted-2);
        font-size: 1.2rem;
      }
      .sync-status, .no-sync {
        color: var(--muted);
        font-size: 0.78rem;
      }
      .sync-status i {
        display: inline-block;
        width: 7px;
        height: 7px;
        margin-right: 0.35rem;
        border-radius: 50%;
        background: var(--accent);
      }
      .sync-status i.ok-dot {
        background: var(--olive);
      }
      .logout {
        margin-top: 1rem;
        border: 0;
        border-bottom: 1px solid var(--ink);
        background: transparent;
        color: var(--ink);
        padding: 0.5rem 0;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
      }
      .state {
        color: var(--muted);
      }
      .state.error {
        color: #9e382b;
      }
      @media (max-width: 760px) {
        .profile-grid {
          display: block;
        }
        .card {
          margin-bottom: 0.75rem;
        }
        .identity {
          min-height: 240px;
        }
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
