import { Pipe, PipeTransform } from '@angular/core';
import { ReleaseType } from './api.service';

export function releaseTypeLabel(type: ReleaseType): string {
  if (type === 'album') return 'Album';
  if (type === 'ep') return 'EP';
  return 'Single';
}

@Pipe({ name: 'releaseTypeLabel', standalone: true })
export class ReleaseTypeLabelPipe implements PipeTransform {
  transform(type: ReleaseType): string {
    return releaseTypeLabel(type);
  }
}
