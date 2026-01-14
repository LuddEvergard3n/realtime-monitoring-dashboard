import { Component } from '@angular/core';
import { DashboardComponent } from '@features/dashboard/dashboard.component';

/**
 * Root application component.
 * 
 * Responsibilities:
 * - Bootstrap the dashboard
 * - Minimal structure (just renders dashboard)
 * 
 * Architecture:
 * - Standalone component (no NgModule)
 * - No business logic
 * - Single responsibility: application entry point
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: '<app-dashboard></app-dashboard>',
  styles: []
})
export class AppComponent {}
