import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, ReleaseItem, ReleaseType } from '../../core/api.service';
import { ShellComponent } from '../../shared/shell.component';
import { ReleaseListComponent } from '../../shared/release-list.component';
import { ReleaseTypeFilterComponent } from '../../shared/release-type-filter.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [ShellComponent, ReleaseListComponent, DatePipe, ReleaseTypeFilterComponent],
  template: `
    <app-shell
      title="Calendario"
      subtitle="Una cronologia compatta per ritrovare ogni uscita nel giorno in cui è arrivata."
    >
      <div class="filter-bar">
        <span>Filtra il calendario</span>
        <app-release-type-filter
          [selected]="selected()"
          (selectedChange)="onTypes($event)"
        />
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
              <div class="date">
                <strong>{{ d.date | date: 'dd' : undefined : 'it-IT' }}</strong>
                <span>{{ d.date | date: 'MMM' : undefined : 'it-IT' }}</span>
                <small>{{ d.date | date: 'y' : undefined : 'it-IT' }}</small>
              </div>
              <div class="day-content">
                <h2>{{ d.date | date: 'EEEE' : undefined : 'it-IT' }}</h2>
                <app-release-list [releases]="d.releases" [compact]="true" />
              </div>
            </section>
          }
        </div>
      }
    </app-shell>
  `,
  styles: [
    `
      .filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem 0;
        margin-bottom: 2rem;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .filter-bar > span {
        color: var(--muted-2);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 2.75rem;
      }
      .day {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr);
        gap: 1.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--line);
      }
      .date {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .date strong {
        font-family: var(--font-display);
        font-size: 3.5rem;
        line-height: 0.85;
        letter-spacing: -0.06em;
      }
      .date span {
        margin-top: 0.35rem;
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .date small {
        color: var(--muted-2);
        font-size: 0.7rem;
      }
      .day-content {
        min-width: 0;
      }
      .day h2 {
        font-family: var(--font-display);
        font-size: 1.25rem;
        margin: 0 0 0.85rem;
        letter-spacing: -0.02em;
        text-transform: capitalize;
      }
      @media (max-width: 560px) {
        .day {
          grid-template-columns: 62px minmax(0, 1fr);
          gap: 0.75rem;
        }
        .date strong {
          font-size: 2.7rem;
        }
      }
    `,
  ],
})
export class CalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly selected = signal<ReleaseType[]>(['album', 'single', 'ep']);
  readonly days = signal<{ date: string; releases: ReleaseItem[] }[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onTypes(next: ReleaseType[]): void {
    this.selected.set(next);
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
