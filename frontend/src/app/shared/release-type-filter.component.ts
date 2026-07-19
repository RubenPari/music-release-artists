import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReleaseType } from '../core/api.service';
import { ReleaseTypeLabelPipe } from '../core/release-type-label';

@Component({
  selector: 'app-release-type-filter',
  standalone: true,
  imports: [ReleaseTypeLabelPipe],
  template: `
    <div class="filters" role="group" aria-label="Filtra per tipo">
      @for (t of allTypes; track t) {
        <button
          type="button"
          class="chip"
          [class.on]="selected.includes(t)"
          [attr.aria-pressed]="selected.includes(t)"
          (click)="toggle(t)"
        >
          {{ t | releaseTypeLabel }}
        </button>
      }
    </div>
  `,
})
export class ReleaseTypeFilterComponent {
  @Input({ required: true }) selected!: ReleaseType[];
  @Output() selectedChange = new EventEmitter<ReleaseType[]>();

  readonly allTypes: ReleaseType[] = ['album', 'single', 'ep'];

  toggle(t: ReleaseType): void {
    const cur = this.selected;
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    if (!next.length) return;
    this.selectedChange.emit(next);
  }
}
