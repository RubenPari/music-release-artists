import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login">
      <main class="login-inner">
        <section class="panel">
          <div class="wordmark">
            <span class="vinyl" aria-hidden="true"><i></i></span>
            <strong>Uscite</strong>
          </div>
          <p class="eyebrow">Il tuo radar musicale</p>
          <h1>Non perdere<br />il prossimo <em>disco.</em></h1>
          <p class="lede">
            Le nuove uscite degli artisti che segui, ordinate e pronte da
            ascoltare. Con un avviso quando arriva qualcosa di nuovo.
          </p>
          @if (error) {
            <p class="error">L'accesso non è riuscito. Riprova da qui.</p>
          }
          <a class="cta" [href]="loginUrl">
            <span class="spotify-mark" aria-hidden="true">≋</span>
            Continua con Spotify
            <span aria-hidden="true">→</span>
          </a>
          <p class="privacy">Leggiamo solo gli artisti che segui su Spotify.</p>
        </section>
        <div class="sleeves" aria-hidden="true">
          <div class="sleeve sleeve-a">
            <span>New<br />music</span>
            <small>01 / 03</small>
          </div>
          <div class="sleeve sleeve-b">
            <span class="sun"></span>
            <small>02 / 03</small>
          </div>
          <div class="sleeve sleeve-c">
            <span>PLAY<br />IT<br />LOUD</span>
            <small>03 / 03</small>
          </div>
          <div class="record"><span></span></div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .login {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: clamp(1.25rem, 4vw, 4rem);
        position: relative;
        overflow: hidden;
        background: var(--paper);
      }
      .login::before {
        content: '';
        position: absolute;
        width: 38vw;
        height: 38vw;
        min-width: 320px;
        min-height: 320px;
        right: -12vw;
        top: -16vw;
        border-radius: 50%;
        background: var(--accent);
        opacity: 0.92;
        pointer-events: none;
      }
      .login-inner {
        width: min(1120px, 100%);
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
        gap: clamp(3rem, 8vw, 8rem);
        align-items: center;
        position: relative;
        z-index: 1;
      }
      .panel {
        position: relative;
        animation: rise 560ms ease both;
      }
      .wordmark {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-bottom: clamp(3rem, 10vh, 7rem);
      }
      .wordmark strong {
        font-family: var(--font-display);
        font-size: 1.5rem;
        letter-spacing: -0.04em;
      }
      .vinyl {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: repeating-radial-gradient(circle, var(--ink) 0 4px, #35383b 5px 6px);
      }
      .vinyl i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--accent);
        border: 2px solid var(--paper);
      }
      .eyebrow {
        margin: 0 0 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.13em;
        font-size: 0.68rem;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: clamp(3.4rem, 6.8vw, 6.5rem);
        margin: 0;
        letter-spacing: -0.06em;
        line-height: 0.86;
      }
      h1 em {
        color: var(--accent-2);
        font-weight: inherit;
      }
      .lede {
        margin: 1.5rem 0 2rem;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.6;
        max-width: 42ch;
      }
      .cta {
        width: min(100%, 360px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 3.5rem;
        padding: 0 1rem;
        background: var(--ink);
        color: var(--surface);
        text-decoration: none;
        font-weight: 700;
        transition: transform 160ms ease, background 160ms ease;
      }
      .cta:hover {
        transform: translateY(-2px);
        background: var(--accent-2);
      }
      .spotify-mark {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--ink);
        background: #1ed760;
        font-size: 1.4rem;
        line-height: 1;
      }
      .error {
        color: #9e382b;
        margin: 0 0 1rem;
      }
      .privacy {
        margin: 0.75rem 0 0;
        color: var(--muted-2);
        font-size: 0.72rem;
      }
      .sleeves {
        min-height: 620px;
        position: relative;
      }
      .sleeve {
        position: absolute;
        width: min(32vw, 340px);
        aspect-ratio: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 28px 65px rgba(37, 31, 22, 0.2);
      }
      .sleeve small {
        align-self: flex-end;
        font-size: 0.65rem;
        letter-spacing: 0.1em;
      }
      .sleeve-a {
        left: 0;
        top: 12%;
        z-index: 3;
        color: var(--surface);
        background: var(--accent-2);
        transform: rotate(-7deg);
      }
      .sleeve-a span {
        font-family: var(--font-display);
        font-size: clamp(3rem, 5.5vw, 5.4rem);
        line-height: 0.8;
        letter-spacing: -0.08em;
      }
      .sleeve-b {
        right: 1%;
        top: 2%;
        z-index: 2;
        background: #e8c84b;
        transform: rotate(8deg);
      }
      .sun {
        width: 70%;
        aspect-ratio: 1;
        margin: auto;
        border-radius: 50%;
        background: var(--accent);
      }
      .sleeve-c {
        right: 5%;
        bottom: 0;
        z-index: 4;
        color: var(--surface);
        background: var(--olive);
        transform: rotate(3deg);
      }
      .sleeve-c span {
        font-size: clamp(2.5rem, 5vw, 4.8rem);
        font-weight: 700;
        line-height: 0.82;
        letter-spacing: -0.07em;
      }
      .record {
        position: absolute;
        left: 10%;
        bottom: 2%;
        width: min(30vw, 320px);
        aspect-ratio: 1;
        z-index: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: repeating-radial-gradient(circle, var(--ink) 0 5px, #333639 6px 7px);
        animation: spin 18s linear infinite;
      }
      .record span {
        width: 30%;
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--accent);
        border: 8px solid var(--paper);
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
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 860px) {
        .login {
          display: block;
          padding-bottom: 3rem;
        }
        .login-inner {
          display: block;
        }
        .wordmark {
          margin-bottom: 3.5rem;
        }
        .sleeves {
          min-height: 360px;
          margin-top: 3rem;
        }
        .sleeve {
          width: min(60vw, 260px);
        }
        .sleeve-a {
          left: 2%;
        }
        .sleeve-b {
          right: 2%;
        }
        .sleeve-c {
          display: none;
        }
        .record {
          width: min(55vw, 240px);
          left: 30%;
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
