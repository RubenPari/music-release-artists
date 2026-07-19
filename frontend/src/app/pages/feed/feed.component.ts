import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, ReleaseItem, ReleaseType } from '../../core/api.service';
import { ShellComponent } from '../../shared/shell.component';
import { ReleaseListComponent } from '../../shared/release-list.component';
import { ReleaseTypeFilterComponent } from '../../shared/release-type-filter.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [ShellComponent, ReleaseListComponent, ReleaseTypeFilterComponent],
  template: `
    <app-shell
      title="Nuove uscite"
      subtitle="Tutto quello che è appena arrivato dagli artisti che segui, raccolto in un unico scaffale."
    >
      <div class="toolbar">
        <div class="filter-block">
          <span class="filter-label">Mostra</span>
          <app-release-type-filter
            [selected]="selected()"
            (selectedChange)="onTypes($event)"
          />
        </div>
        <button
          type="button"
          class="refresh"
          [disabled]="syncing()"
          (click)="refresh()"
        >
          <span aria-hidden="true" [class.spinning]="syncing()">↻</span>
          {{ syncing() ? 'Sto cercando…' : 'Cerca nuove uscite' }}
        </button>
      </div>

      @if (loading()) {
        <div class="skeletons" aria-label="Caricamento uscite">
          @for (i of [1, 2, 3, 4]; track i) {
            <span></span>
          }
        </div>
      } @else if (error()) {
        <div class="state error">
          <strong>Il feed non è disponibile.</strong>
          <span>{{ error() }}</span>
        </div>
      } @else if (!releases().length) {
        <div class="state empty">
          <span class="empty-record" aria-hidden="true"></span>
          <strong>Lo scaffale è ancora vuoto.</strong>
          <span>Cerca nuove uscite per sincronizzare gli ultimi 90 giorni.</span>
        </div>
      } @else {
        <div class="result-line">
          <span>{{ releases().length }} uscite</span>
          <span>Ultimi 90 giorni</span>
        </div>
        <app-release-list [releases]="releases()" />
      }
    </app-shell>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 2.5rem;
        padding: 1.2rem 0;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .filter-block {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .filter-label {
        color: var(--muted-2);
        font-size: 0.64rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .refresh {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border: 0;
        border-bottom: 1px solid var(--ink);
        padding: 0.45rem 0;
        color: var(--ink);
        background: transparent;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
      }
      .refresh span {
        color: var(--accent);
        font-size: 1.2rem;
      }
      .spinning {
        animation: spin 800ms linear infinite;
      }
      .refresh:disabled {
        opacity: 0.6;
        cursor: wait;
      }
      .result-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        color: var(--muted-2);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .state strong {
        color: var(--ink);
        font-family: var(--font-display);
        font-size: 1.4rem;
      }
      .empty-record {
        width: 64px;
        height: 64px;
        margin-bottom: 0.75rem;
        border-radius: 50%;
        background:
          radial-gradient(circle, var(--accent) 0 6px, var(--paper) 7px 9px, transparent 10px),
          repeating-radial-gradient(circle, var(--ink) 0 3px, #303236 4px 5px);
      }
      .skeletons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
      .skeletons span {
        aspect-ratio: 1;
        background: linear-gradient(
          90deg,
          var(--paper-deep) 25%,
          var(--surface) 50%,
          var(--paper-deep) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
      @media (max-width: 640px) {
        .toolbar {
          align-items: stretch;
          margin-bottom: 2rem;
        }
        .filter-block {
          width: 100%;
        }
        .refresh {
          width: max-content;
        }
        .skeletons {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly selected = signal<ReleaseType[]>(['album', 'single', 'ep']);
  readonly releases = signal<ReleaseItem[]>([]);
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onTypes(next: ReleaseType[]): void {
    this.selected.set(next);
    this.load();
  }

  refresh(): void {
    this.syncing.set(true);
    this.error.set(null);
    this.api.refreshSync().subscribe({
      next: () => {
        this.syncing.set(false);
        this.load();
      },
      error: (err) => {
        this.syncing.set(false);
        this.error.set(
          err?.error?.message || 'Sincronizzazione non riuscita.',
        );
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.feedReleases(this.selected()).subscribe({
      next: (res) => {
        this.releases.set(res.releases);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Impossibile caricare il feed.');
      },
    });
  }
}
