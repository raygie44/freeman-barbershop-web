import { Pipe, PipeTransform } from '@angular/core';
import { fmtDuration } from './format';

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    return minutes ? fmtDuration(minutes) : '';
  }
}
