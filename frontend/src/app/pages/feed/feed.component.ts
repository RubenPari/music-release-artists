import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, ReleaseItem } from '../../core/api.service';
import { ShellComponent } from '../../shared/shell.component';
import { ReleaseListComponent } from '../../shared/release-list.component';

type ReleaseType = 'album' | 'single' | 'ep';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [ShellComponent, ReleaseListComponent],
  template: `
    <app-shell
      title="Feed uscite"
      subtitle="Album, single ed EP degli artisti che segui — ultimi 90 giorni."
    >
      <div class="toolbar">
        <div class="filters" role="group" aria-label="Filtra per tipo">
          @for (t of allTypes; track t) {
            <button
              type="button"
              class="chip"
              [class.on]="selected().includes(t)"
              (click)="toggle(t)"
            >
              {{ label(t) }}
            </button>
          }
        </div>
        <button
          type="button"
          class="refresh"
          [disabled]="syncing()"
          (click)="refresh()"
        >
          {{ syncing() ? 'Sincronizzo…' : 'Aggiorna' }}
        </button>
      </div>

      @if (loading()) {
        <p class="state">Caricamento uscite…</p>
      } @else if (error()) {
        <p class="state error">{{ error() }}</p>
      } @else if (!releases().length) {
        <p class="state">Nessuna uscita in questa finestra. Prova ad aggiornare.</p>
      } @else {
        <app-release-list [releases]="releases()" />
      }
    </app-shell>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip,
      .refresh {
        border: 1px solid color-mix(in oklab, var(--ink) 14%, transparent);
        background: transparent;
        color: var(--ink);
        border-radius: 0.45rem;
        padding: 0.45rem 0.75rem;
        font: inherit;
        cursor: pointer;
        transition: background 150ms ease, border-color 150ms ease;
      }
      .chip.on {
        background: color-mix(in oklab, var(--accent) 22%, transparent);
        border-color: color-mix(in oklab, var(--accent) 45%, transparent);
      }
      .refresh:disabled {
        opacity: 0.6;
        cursor: wait;
      }
      .state {
        color: var(--muted);
        padding: 1.5rem 0;
      }
      .state.error {
        color: #c44b4b;
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly allTypes: ReleaseType[] = ['album', 'single', 'ep'];
  readonly selected = signal<ReleaseType[]>(['album', 'single', 'ep']);
  readonly releases = signal<ReleaseItem[]>([]);
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  label(t: ReleaseType): string {
    if (t === 'album') return 'Album';
    if (t === 'ep') return 'EP';
    return 'Single';
  }

  toggle(t: ReleaseType): void {
    const cur = this.selected();
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    this.selected.set(next.length ? next : cur);
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
