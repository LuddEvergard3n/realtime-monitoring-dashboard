import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '@core/services/dashboard-state.service';
import { EventSeverity } from '@core/models/event.model';

/**
 * Sidebar component for event filtering.
 * 
 * Responsibilities:
 * - Display available filter options
 * - Toggle severity filters
 * - Toggle source filters
 * - Clear all filters
 * 
 * Architecture:
 * - Pure presentation component
 * - Delegates state changes to service
 * - Reads filter state via computed signals
 * 
 * Performance:
 * - OnPush change detection
 * - No manual subscriptions (signals handle reactivity)
 * - Minimal re-renders (only when filters or sources change)
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private readonly stateService = inject(DashboardStateService);
  
  // Available filter options
  protected readonly severities: EventSeverity[] = ['INFO', 'WARNING', 'ERROR'];
  
  // Current filter state (computed signals)
  protected readonly activeFilters = this.stateService.activeFilters;
  protected readonly availableSources = this.stateService.availableSources;
  
  /**
   * Toggle severity filter.
   * Delegates to state service for immutable state update.
   */
  protected toggleSeverity(severity: EventSeverity): void {
    this.stateService.toggleSeverityFilter(severity);
  }
  
  /**
   * Toggle source filter.
   * Delegates to state service for immutable state update.
   */
  protected toggleSource(source: string): void {
    this.stateService.toggleSourceFilter(source);
  }
  
  /**
   * Clear all active filters.
   * Resets filters to default state (show all).
   */
  protected clearFilters(): void {
    this.stateService.clearFilters();
  }
  
  /**
   * Check if severity filter is active.
   * Used for checkbox checked state and visual feedback.
   */
  protected isSeverityActive(severity: EventSeverity): boolean {
    return this.activeFilters().severities.has(severity);
  }
  
  /**
   * Check if source filter is active.
   * Used for checkbox checked state and visual feedback.
   */
  protected isSourceActive(source: string): boolean {
    return this.activeFilters().sources.has(source);
  }
  
  /**
   * Check if any filters are active.
   * Used to conditionally show "Clear filters" button.
   */
  protected hasActiveFilters(): boolean {
    const filters = this.activeFilters();
    return filters.severities.size > 0 || filters.sources.size > 0;
  }
  
  /**
   * Get CSS class for severity checkbox label.
   * Provides visual feedback matching event card colors.
   */
  protected getSeverityClass(severity: EventSeverity): string {
    return `filter-checkbox--${severity.toLowerCase()}`;
  }
}
