import { signal } from '@angular/core';
import { ReleaseType } from '../core/api.service';

const ALL_TYPES: ReleaseType[] = ['album', 'single', 'ep'];

/**
 * Base state condiviso dalle pagine che filtrano le release per tipo
 * (feed e calendario): gestione di selezione, loading ed errore.
 */
export abstract class FilteredReleasesPage {
  readonly selected = signal<ReleaseType[]>([...ALL_TYPES]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  onTypes(next: ReleaseType[]): void {
    this.selected.set(next);
    this.load();
  }

  protected abstract load(): void;
}
