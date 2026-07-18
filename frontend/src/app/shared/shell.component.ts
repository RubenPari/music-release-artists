import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="top">
        <a routerLink="/" class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-name">Uscite</span>
        </a>
        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
            >Feed</a
          >
          <a routerLink="/calendario" routerLinkActive="active">Calendario</a>
          <a routerLink="/profilo" routerLinkActive="active">Profilo</a>
        </nav>
      </header>
      <main class="main">
        @if (title) {
          <div class="page-head">
            <h1>{{ title }}</h1>
            @if (subtitle) {
              <p>{{ subtitle }}</p>
            }
          </div>
        }
        <ng-content />
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid color-mix(in oklab, var(--ink) 12%, transparent);
        backdrop-filter: blur(10px);
        position: sticky;
        top: 0;
        z-index: 10;
        background: color-mix(in oklab, var(--bg) 88%, transparent);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        text-decoration: none;
        color: var(--ink);
      }
      .brand-mark {
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 2px;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 25%, transparent);
        animation: pulse-mark 3.2s ease-in-out infinite;
      }
      .brand-name {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1.35rem;
        letter-spacing: -0.03em;
      }
      .nav {
        display: flex;
        gap: 0.35rem;
      }
      .nav a {
        text-decoration: none;
        color: var(--muted);
        font-size: 0.92rem;
        padding: 0.45rem 0.7rem;
        border-radius: 0.4rem;
        transition: color 160ms ease, background 160ms ease;
      }
      .nav a:hover {
        color: var(--ink);
      }
      .nav a.active {
        color: var(--ink);
        background: color-mix(in oklab, var(--accent) 16%, transparent);
      }
      .main {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 1.5rem 1.25rem 3rem;
        flex: 1;
      }
      .page-head {
        margin-bottom: 1.4rem;
        animation: rise 480ms ease both;
      }
      .page-head h1 {
        font-family: var(--font-display);
        font-size: clamp(1.8rem, 4vw, 2.4rem);
        letter-spacing: -0.04em;
        margin: 0 0 0.35rem;
        line-height: 1.1;
      }
      .page-head p {
        margin: 0;
        color: var(--muted);
      }
      @keyframes pulse-mark {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @media (max-width: 560px) {
        .top {
          flex-wrap: wrap;
        }
        .nav {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class ShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
