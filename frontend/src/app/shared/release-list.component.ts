import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReleaseItem } from '../core/api.service';
import { ReleaseTypeLabelPipe } from '../core/release-type-label';

@Component({
  selector: 'app-release-list',
  standalone: true,
  imports: [DatePipe, ReleaseTypeLabelPipe],
  template: `
    <ul class="list" [class.compact]="compact">
      @for (r of releases; track r.id; let i = $index) {
        <li class="item" [style.animation-delay.ms]="i * 45">
          <a class="row" [href]="r.spotifyUrl" target="_blank" rel="noopener">
            <div class="art" [class.placeholder]="!r.artworkUrl">
              @if (r.artworkUrl) {
                <img [src]="r.artworkUrl" [alt]="r.title" loading="lazy" />
              } @else {
                <span aria-hidden="true">{{ initial(r) }}</span>
              }
              <span class="play" aria-hidden="true">↗</span>
            </div>
            <div class="meta">
              <div class="sub">
                <span class="type">{{ r.releaseType | releaseTypeLabel }}</span>
                <span>{{ r.releaseDate | date: 'd MMM y' }}</span>
              </div>
              <div class="title">{{ r.title }}</div>
              <div class="artists">{{ artistNames(r) }}</div>
            </div>
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
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: clamp(1.25rem, 3vw, 2.5rem) clamp(0.8rem, 2vw, 1.5rem);
      }
      .item {
        animation: sleeve 420ms ease both;
        min-width: 0;
      }
      .row {
        display: block;
        text-decoration: none;
        color: inherit;
        transition: transform 220ms ease;
      }
      .art {
        aspect-ratio: 1;
        width: 100%;
        position: relative;
        overflow: hidden;
        background:
          linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%),
          var(--accent-2);
        box-shadow: 0 10px 25px rgba(37, 33, 25, 0.13);
        transition: transform 240ms ease, box-shadow 240ms ease;
      }
      .art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .art > span:first-child:not(.play) {
        position: absolute;
        left: 1rem;
        bottom: 0.5rem;
        font-family: var(--font-display);
        font-size: clamp(3rem, 8vw, 6rem);
        color: rgba(255, 255, 255, 0.86);
      }
      .play {
        position: absolute;
        right: 0.75rem;
        bottom: 0.75rem;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--surface);
        background: var(--ink);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 180ms ease, transform 180ms ease;
      }
      .row:hover {
        transform: translateY(-3px);
      }
      .row:hover .art {
        box-shadow: 0 18px 35px rgba(37, 33, 25, 0.2);
      }
      .row:hover .play {
        opacity: 1;
        transform: none;
      }
      .meta {
        padding-top: 0.85rem;
      }
      .title {
        font-weight: 700;
        font-size: 1.02rem;
        letter-spacing: -0.025em;
        line-height: 1.2;
        margin-top: 0.45rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .artists {
        color: var(--muted);
        font-size: 0.85rem;
        margin-top: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sub {
        font-size: 0.68rem;
        color: var(--muted-2);
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .type {
        font-weight: 700;
        color: var(--accent);
      }
      .compact {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .compact .row {
        display: grid;
        grid-template-columns: 68px minmax(0, 1fr);
        gap: 1rem;
        align-items: center;
        padding: 0.4rem;
        border-radius: 4px;
      }
      .compact .row:hover {
        transform: translateX(3px);
        background: rgba(255, 255, 255, 0.45);
      }
      .compact .art {
        width: 68px;
        height: 68px;
      }
      .compact .art > span:first-child:not(.play) {
        font-size: 2rem;
        left: 0.5rem;
      }
      .compact .play {
        display: none;
      }
      .compact .meta {
        padding: 0;
      }
      .compact .sub {
        justify-content: flex-start;
      }
      .compact .title {
        margin-top: 0.25rem;
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
      @media (max-width: 900px) {
        .list {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem 0.8rem;
        }
        .play {
          display: none;
        }
        .title {
          font-size: 0.94rem;
        }
      }
    `,
  ],
})
export class ReleaseListComponent {
  @Input({ required: true }) releases: ReleaseItem[] = [];
  @Input() compact = false;

  artistNames(r: ReleaseItem): string {
    return r.artists.map((a) => a.name).join(', ');
  }

  initial(r: ReleaseItem): string {
    return r.title.trim().charAt(0).toUpperCase() || '♪';
  }
}
