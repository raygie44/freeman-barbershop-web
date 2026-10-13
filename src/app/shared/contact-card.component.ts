import { Component, computed, inject } from '@angular/core';
import { ShopStore } from '../core/shop.store';

@Component({
  selector: 'app-contact-card',
  template: `
    <div class="card contact-card">
      <ul class="contact-list">
        <li><span class="label">Address</span><span>{{ s().address }}</span></li>
        <li><span class="label">Phone</span><a [href]="'tel:' + shop.phoneDigits()">{{ s().phone }}</a></li>
        @if (s().email) {
          <li><span class="label">Email</span><a [href]="'mailto:' + s().email">{{ s().email }}</a></li>
        }
        <li>
          <span class="label">Follow</span>
          <span class="socials">
            <a [href]="shop.facebookUrl()" target="_blank" rel="noopener">Facebook</a>
            <a [href]="shop.instagramUrl()" target="_blank" rel="noopener">Instagram</a>
            @if (shop.tiktokUrl()) { <a [href]="shop.tiktokUrl()" target="_blank" rel="noopener">TikTok</a> }
          </span>
        </li>
      </ul>
      <h3>Business hours</h3>
      <table class="hours">
        @for (r of shop.hoursRows(); track r.day) {
          <tr [class.closed]="!r.open">
            <th>{{ r.day }}</th>
            <td>{{ r.text }} @if (r.breakText) { <small>{{ r.breakText }}</small> }</td>
          </tr>
        }
      </table>
    </div>
  `,
})
export class ContactCardComponent {
  shop = inject(ShopStore);
  s = computed(() => this.shop.settings());
}
