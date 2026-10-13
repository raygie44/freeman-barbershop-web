import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="heading()" (click)="$event.stopPropagation()">
        <header>
          <h3>{{ heading() }}</h3>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </header>
        <div class="modal-body"><ng-content /></div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  heading = input('');
  closed = output<void>();
}
