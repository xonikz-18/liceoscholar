import { Component } from '@angular/core';

/**
 * Slot for the bare site root.
 *
 * `homeGuard` always redirects to the correct portal for the signed-in role,
 * so this component is never actually rendered. It exists only because Angular
 * requires a route without a `redirectTo` to declare a component.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  template: ''
})
export class HomeComponent {}
