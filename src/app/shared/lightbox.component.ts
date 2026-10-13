import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="lightbox" (click)="closed.emit()" role="dialog" aria-modal="true" [attr.aria-label]="caption()">
      <button class="lightbox-close" type="button" (click)="closed.emit()" aria-label="Close">✕</button>
      <figure (click)="$event.stopPropagation()">
        <img [src]="src()" [alt]="caption()" />
        @if (caption()) { <figcaption>{{ caption() }}</figcaption> }
      </figure>
    </div>
  `,
})
export class LightboxComponent {
  src = input.required<string>();
  caption = input('');
  closed = output<void>();
}
