import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '@core/services/dashboard-state.service';

/**
 * Metrics panel component.
 * 
 * Responsibilities:
 * - Display aggregate statistics
 * - Show event distribution by severity
 * - Display real-time event rate
 * 
 * Architecture:
 * - Pure presentation component
 * - Reads computed metrics from state service
 * - No local state or business logic
 * 
 * Performance:
 * - OnPush change detection
 * - Metrics computed automatically via signals
 * - No manual subscriptions needed
 * 
 * Design:
 * - Card-based layout for visual separation
 * - Color-coded severity counts
 * - Clear typography hierarchy
 */
@Component({
  selector: 'app-metrics-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-panel.component.html',
  styleUrls: ['./metrics-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsPanelComponent {
  private readonly stateService = inject(DashboardStateService);
  
  // Computed metrics from state service
  protected readonly metrics = this.stateService.metrics;
  
  /**
   * Format events per second with decimal precision.
   * 
   * @param rate Events per second (floating point)
   * @returns Formatted string with 2 decimal places
   */
  protected formatRate(rate: number): string {
    return rate.toFixed(2);
  }
  
  /**
   * Get CSS class for severity metric card.
   * Provides visual consistency with event cards.
   */
  protected getSeverityClass(severity: string): string {
    return `metric-card--${severity.toLowerCase()}`;
  }
}
