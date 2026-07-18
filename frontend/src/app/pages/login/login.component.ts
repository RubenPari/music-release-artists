import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login">
      <div class="panel">
        <div class="glow" aria-hidden="true"></div>
        <p class="eyebrow">Music Release Artists</p>
        <h1 class="brand">Uscite</h1>
        <p class="lede">
          Il feed delle nuove uscite degli artisti che segui su Spotify — con
          alert email quando esce qualcosa.
        </p>
        @if (error) {
          <p class="error">Accesso non riuscito. Riprova.</p>
        }
        <a class="cta" [href]="loginUrl">Accedi con Spotify</a>
      </div>
    </div>
  `,
  styles: [
    `
      .login {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
      }
      .login::before {
        content: '';
        position: absolute;
        inset: -20%;
        background:
          radial-gradient(ellipse at 20% 20%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 45%),
          radial-gradient(ellipse at 80% 70%, color-mix(in oklab, var(--accent-2) 22%, transparent), transparent 50%);
        animation: drift 14s ease-in-out infinite alternate;
        pointer-events: none;
      }
      .panel {
        position: relative;
        width: min(440px, 100%);
        animation: rise 560ms ease both;
      }
      .glow {
        position: absolute;
        inset: -2rem;
        background: radial-gradient(circle at 30% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%);
        filter: blur(8px);
        z-index: -1;
      }
      .eyebrow {
        margin: 0 0 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        color: var(--muted-2);
        font-weight: 600;
      }
      .brand {
        font-family: var(--font-display);
        font-size: clamp(3.2rem, 10vw, 4.4rem);
        margin: 0;
        letter-spacing: -0.05em;
        line-height: 0.95;
      }
      .lede {
        margin: 1rem 0 1.6rem;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.5;
        max-width: 34ch;
      }
      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3rem;
        padding: 0 1.25rem;
        border-radius: 0.5rem;
        background: var(--ink);
        color: var(--bg);
        text-decoration: none;
        font-weight: 700;
        letter-spacing: -0.01em;
        transition: transform 160ms ease, background 160ms ease;
      }
      .cta:hover {
        transform: translateY(-1px);
        background: color-mix(in oklab, var(--ink) 88%, var(--accent));
      }
      .error {
        color: #c44b4b;
        margin: 0 0 1rem;
      }
      @keyframes drift {
        from {
          transform: translate3d(-2%, -1%, 0) scale(1);
        }
        to {
          transform: translate3d(2%, 2%, 0) scale(1.05);
        }
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  loginUrl = this.api.spotifyLoginUrl();
  error = this.route.snapshot.queryParamMap.get('error') === 'oauth';
}
