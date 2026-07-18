import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="top">
        <div class="top-inner">
          <a routerLink="/" class="brand" aria-label="Uscite, pagina iniziale">
            <span class="brand-mark" aria-hidden="true">
              <span></span>
            </span>
            <span class="brand-copy">
              <strong>Uscite</strong>
              <small>il tuo radar musicale</small>
            </span>
          </a>
          <nav class="nav" aria-label="Navigazione principale">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="nav-index">01</span> Feed
            </a>
            <a routerLink="/calendario" routerLinkActive="active">
              <span class="nav-index">02</span> Calendario
            </a>
            <a routerLink="/profilo" routerLinkActive="active">
              <span class="nav-index">03</span> Profilo
            </a>
          </nav>
        </div>
      </header>
      <main class="main">
        @if (title) {
          <div class="page-head">
            <span class="kicker">La tua selezione</span>
            <div class="heading-row">
              <h1>{{ title }}</h1>
              @if (subtitle) {
                <p>{{ subtitle }}</p>
              }
            </div>
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
        padding: 0 1.5rem;
        border-bottom: 1px solid var(--line);
        position: sticky;
        top: 0;
        z-index: 10;
        background: color-mix(in srgb, var(--paper) 92%, transparent);
        backdrop-filter: blur(16px);
      }
      .top-inner {
        min-height: 88px;
        width: min(1120px, 100%);
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        text-decoration: none;
        color: var(--ink);
      }
      .brand-mark {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background:
          repeating-radial-gradient(circle, transparent 0 4px, rgba(255, 255, 255, 0.18) 5px 6px),
          var(--ink);
        transition: transform 400ms ease;
      }
      .brand:hover .brand-mark {
        transform: rotate(24deg);
      }
      .brand-mark span {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: var(--accent);
        border: 2px solid var(--paper);
      }
      .brand-copy {
        display: flex;
        flex-direction: column;
      }
      .brand-copy strong {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1.42rem;
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .brand-copy small {
        margin-top: 0.2rem;
        color: var(--muted);
        font-size: 0.65rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .nav {
        display: flex;
        gap: 1.75rem;
      }
      .nav a {
        text-decoration: none;
        color: var(--muted);
        font-size: 0.86rem;
        font-weight: 600;
        padding: 0.6rem 0;
        border-bottom: 2px solid transparent;
        transition: color 160ms ease, border-color 160ms ease;
      }
      .nav a:hover {
        color: var(--ink);
      }
      .nav a.active {
        color: var(--ink);
        border-color: var(--accent);
      }
      .nav-index {
        color: var(--muted-2);
        font-size: 0.62rem;
        margin-right: 0.25rem;
        vertical-align: top;
      }
      .main {
        width: min(1120px, 100%);
        margin: 0 auto;
        padding: clamp(2rem, 5vw, 4.5rem) 1.5rem 5rem;
        flex: 1;
      }
      .page-head {
        margin-bottom: clamp(2rem, 4vw, 3.5rem);
        animation: rise 480ms ease both;
      }
      .kicker {
        display: block;
        margin-bottom: 0.75rem;
        color: var(--accent);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .heading-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 360px);
        align-items: end;
        gap: 2rem;
      }
      .page-head h1 {
        font-family: var(--font-display);
        font-size: clamp(3rem, 7vw, 6.5rem);
        letter-spacing: -0.055em;
        margin: 0;
        line-height: 0.87;
      }
      .page-head p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
        padding-bottom: 0.4rem;
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
      @media (max-width: 720px) {
        .top {
          padding: 0 1rem;
        }
        .top-inner {
          min-height: 74px;
        }
        .brand-copy small {
          display: none;
        }
        .brand-mark {
          width: 34px;
          height: 34px;
        }
        .nav {
          position: fixed;
          left: 0.75rem;
          right: 0.75rem;
          bottom: 0.75rem;
          z-index: 20;
          justify-content: space-around;
          gap: 0;
          padding: 0.35rem;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: color-mix(in srgb, var(--surface) 94%, transparent);
          box-shadow: var(--shadow);
          backdrop-filter: blur(16px);
        }
        .nav a {
          padding: 0.7rem 0.75rem;
          border: 0;
          border-radius: 11px;
        }
        .nav a.active {
          color: var(--surface);
          background: var(--ink);
        }
        .nav-index {
          display: none;
        }
        .main {
          padding: 2.5rem 1rem 7rem;
        }
        .heading-row {
          display: block;
        }
        .page-head h1 {
          font-size: clamp(3.3rem, 17vw, 5.2rem);
        }
        .page-head p {
          margin-top: 1rem;
          max-width: 35ch;
        }
      }
      @media (max-width: 380px) {
        .top {
          padding-inline: 0.75rem;
        }
      }
    `,
  ],
})
export class ShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
