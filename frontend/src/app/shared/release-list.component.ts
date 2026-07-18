import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReleaseItem } from '../core/api.service';

@Component({
  selector: 'app-release-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <ul class="list">
      @for (r of releases; track r.id; let i = $index) {
        <li class="item" [style.animation-delay.ms]="i * 45">
          <a class="row" [href]="r.spotifyUrl" target="_blank" rel="noopener">
            <div class="art" [class.placeholder]="!r.artworkUrl">
              @if (r.artworkUrl) {
                <img [src]="r.artworkUrl" [alt]="r.title" loading="lazy" />
              }
            </div>
            <div class="meta">
              <div class="title">{{ r.title }}</div>
              <div class="artists">
                {{ artistNames(r) }}
              </div>
              <div class="sub">
                <span class="type">{{ typeLabel(r.releaseType) }}</span>
                <span class="dot">·</span>
                <span>{{ r.releaseDate | date: 'd MMM y' : undefined : 'it-IT' }}</span>
              </div>
            </div>
            <span class="go" aria-hidden="true">↗</span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .item {
        animation: sleeve 420ms ease both;
      }
      .row {
        display: grid;
        grid-template-columns: 64px 1fr auto;
        gap: 0.9rem;
        align-items: center;
        text-decoration: none;
        color: inherit;
        padding: 0.55rem;
        border-radius: 0.55rem;
        transition: background 160ms ease, transform 160ms ease;
      }
      .row:hover {
        background: color-mix(in oklab, var(--accent) 10%, transparent);
        transform: translateX(2px);
      }
      .art {
        width: 64px;
        height: 64px;
        border-radius: 0.35rem;
        overflow: hidden;
        background: linear-gradient(145deg, #1c2430, #0e141c);
        box-shadow: 0 8px 18px color-mix(in oklab, #000 28%, transparent);
      }
      .art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .title {
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.25;
      }
      .artists {
        color: var(--muted);
        font-size: 0.92rem;
        margin-top: 0.15rem;
      }
      .sub {
        margin-top: 0.3rem;
        font-size: 0.8rem;
        color: var(--muted-2);
        display: flex;
        gap: 0.35rem;
        align-items: center;
      }
      .type {
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
        color: var(--accent-2);
      }
      .go {
        color: var(--muted);
        font-size: 1.1rem;
      }
      @keyframes sleeve {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class ReleaseListComponent {
  @Input({ required: true }) releases: ReleaseItem[] = [];

  artistNames(r: ReleaseItem): string {
    return r.artists.map((a) => a.name).join(', ');
  }

  typeLabel(t: ReleaseItem['releaseType']): string {
    if (t === 'album') return 'Album';
    if (t === 'ep') return 'EP';
    return 'Single';
  }
}
