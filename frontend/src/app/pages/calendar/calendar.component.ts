import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, ReleaseItem } from '../../core/api.service';
import { ShellComponent } from '../../shared/shell.component';
import { ReleaseListComponent } from '../../shared/release-list.component';

type ReleaseType = 'album' | 'single' | 'ep';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [ShellComponent, ReleaseListComponent, DatePipe],
  template: `
    <app-shell
      title="Calendario"
      subtitle="Le stesse uscite, raggruppate per giorno."
    >
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

      @if (loading()) {
        <p class="state">Caricamento calendario…</p>
      } @else if (error()) {
        <p class="state error">{{ error() }}</p>
      } @else if (!days().length) {
        <p class="state">Nessuna uscita da mostrare.</p>
      } @else {
        <div class="days">
          @for (d of days(); track d.date) {
            <section class="day">
              <h2>{{ d.date | date: 'EEEE d MMMM y' : undefined : 'it-IT' }}</h2>
              <app-release-list [releases]="d.releases" />
            </section>
          }
        </div>
      }
    </app-shell>
  `,
  styles: [
    `
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1.4rem;
      }
      .chip {
        border: 1px solid color-mix(in oklab, var(--ink) 14%, transparent);
        background: transparent;
        color: var(--ink);
        border-radius: 0.45rem;
        padding: 0.45rem 0.75rem;
        font: inherit;
        cursor: pointer;
      }
      .chip.on {
        background: color-mix(in oklab, var(--accent) 22%, transparent);
        border-color: color-mix(in oklab, var(--accent) 45%, transparent);
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }
      .day h2 {
        font-family: var(--font-display);
        font-size: 1.15rem;
        margin: 0 0 0.65rem;
        letter-spacing: -0.02em;
        text-transform: capitalize;
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
export class CalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly allTypes: ReleaseType[] = ['album', 'single', 'ep'];
  readonly selected = signal<ReleaseType[]>(['album', 'single', 'ep']);
  readonly days = signal<{ date: string; releases: ReleaseItem[] }[]>([]);
  readonly loading = signal(true);
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

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.feedCalendar(this.selected()).subscribe({
      next: (res) => {
        this.days.set(res.days);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message || 'Impossibile caricare il calendario.',
        );
      },
    });
  }
}
