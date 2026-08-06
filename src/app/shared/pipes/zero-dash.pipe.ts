import { formatNumber } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

// Same as the `number` pipe, but renders a zero amount as "-" instead of "0" -
// the usual convention for dense financial tables where a lot of cells are
// legitimately empty (e.g. a future month with no actual spend yet).
@Pipe({ name: 'zeroDash', standalone: true })
export class ZeroDashPipe implements PipeTransform {
  transform(value: number | null | undefined, digitsInfo = '1.0-0'): string {
    if (value == null || value === 0) return '-';
    return formatNumber(value, 'en-US', digitsInfo);
  }
}
