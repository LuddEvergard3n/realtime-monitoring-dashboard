import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '@core/services/dashboard-state.service';
import { MonitoringEvent } from '@core/models/event.model';

/**
 * Event list component WITHOUT virtual scrolling.
 * 
 * Simple, guaranteed to work version.
 * Removes CDK Virtual Scroll complexity.
 * 
 * Performance: Good for up to ~500 events.
 * Beyond that, may see slight FPS drops but still usable.
 */
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent {
  private readonly stateService = inject(DashboardStateService);
  
  // Filtered events from state service
  protected readonly events = this.stateService.filteredEvents;
  
  /**
   * Format timestamp for display.
   */
  protected formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Get CSS class for severity badge.
   */
  protected getSeverityClass(severity: string): string {
    return `event-card__severity--${severity.toLowerCase()}`;
  }
}
