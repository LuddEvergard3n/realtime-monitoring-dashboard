import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DashboardStateService } from '@core/services/dashboard-state.service';
import { MonitoringEvent } from '@core/models/event.model';

/**
 * Event list component with virtual scrolling.
 * VERSION WITH DEBUG LOGGING
 */
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent {
  private readonly stateService = inject(DashboardStateService);
  
  // Filtered events from state service (computed signal)
  protected readonly events = this.stateService.filteredEvents;
  
  // Virtual scroll configuration
  protected readonly ITEM_SIZE = 120; // Increased even more for safety
  
  constructor() {
    // Debug: Log events whenever they change
    effect(() => {
      const eventsList = this.events();
      console.log('=== EVENT LIST DEBUG ===');
      console.log('Total events:', eventsList.length);
      
      if (eventsList.length > 0) {
        console.log('Latest event:', eventsList[eventsList.length - 1]);
        console.log('Message:', eventsList[eventsList.length - 1].message);
      }
      
      console.log('All events:', eventsList);
      console.log('========================');
    });
  }
  
  /**
   * Track by function for *cdkVirtualFor.
   */
  protected trackByEventId(index: number, event: MonitoringEvent): string {
    return event.id;
  }
  
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
