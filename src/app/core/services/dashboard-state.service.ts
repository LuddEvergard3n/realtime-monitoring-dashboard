import { Injectable, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WebSocketService } from './websocket.service';
import { 
  MonitoringEvent, 
  EventSeverity, 
  DashboardState, 
  EventFilters, 
  EventMetrics,
  ConnectionStatus
} from '@core/models/event.model';

/**
 * State management service using Angular Signals.
 * 
 * Architecture rationale:
 * - Signals for synchronous, local state (events, filters)
 * - Computed signals for derived data (filtered events, metrics)
 * - RxJS only for WebSocket stream (async boundary)
 * - Immutable state updates (copy-on-write pattern)
 * - Single source of truth for entire dashboard state
 * 
 * Why Signals over RxJS everywhere:
 * - Better performance (fine-grained reactivity, no zone.js)
 * - Simpler mental model for state (no subscription management)
 * - Computed values auto-update without manual operators
 * - Type-safe and predictable
 * 
 * Where RxJS remains:
 * - WebSocket events (true async stream from external source)
 * - Timer for rate calculation (interval-based logic)
 * 
 * Backpressure strategy:
 * Keep only last N events in memory to prevent unbounded growth.
 * Simple sliding window approach.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  private readonly wsService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);
  
  // Configuration: maximum events to keep in memory
  // Trade-off: Memory vs. history depth
  private readonly MAX_EVENTS = 1000;
  
  // Sliding window for rate calculation (last N seconds)
  private readonly RATE_WINDOW_SECONDS = 5;
  
  // ===== CORE STATE SIGNALS =====
  
  /**
   * Primary state signal: all events received.
   * Immutable array to prevent accidental mutations.
   * Limited to MAX_EVENTS for memory efficiency.
   */
  private readonly eventsSignal = signal<readonly MonitoringEvent[]>([]);
  
  /**
   * Connection status signal.
   * Reflects WebSocket connection state for UI indicators.
   */
  private readonly connectionStatusSignal = signal<ConnectionStatus>('disconnected');
  
  /**
   * Active filters signal.
   * Empty sets mean "no filter" (show all).
   */
  private readonly filtersSignal = signal<EventFilters>({
    severities: new Set<EventSeverity>(),
    sources: new Set<string>()
  });
  
  // ===== COMPUTED SIGNALS (DERIVED STATE) =====
  
  /**
   * Filtered events based on active filters.
   * Automatically recomputes when events or filters change.
   * 
   * Performance: O(n) where n = number of events.
   * Virtual scroll handles rendering performance.
   */
  public readonly filteredEvents = computed(() => {
    const events = this.eventsSignal();
    const filters = this.filtersSignal();
    
    // No filters active: return all events
    if (filters.severities.size === 0 && filters.sources.size === 0) {
      return events;
    }
    
    return events.filter(event => {
      const severityMatch = filters.severities.size === 0 || filters.severities.has(event.severity);
      const sourceMatch = filters.sources.size === 0 || filters.sources.has(event.source);
      return severityMatch && sourceMatch;
    });
  });
  
  /**
   * Aggregated metrics computed from all events.
   * Updates automatically when events change.
   * 
   * Design: Compute on-demand vs. incremental updates.
   * Trade-off: Simplicity and correctness over micro-optimization.
   * For 1000 events, computation is negligible.
   */
  public readonly metrics = computed<EventMetrics>(() => {
    const events = this.eventsSignal();
    
    // Count events by severity
    const eventsBySeverity: Record<EventSeverity, number> = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0
    };
    
    events.forEach(event => {
      eventsBySeverity[event.severity]++;
    });
    
    // Calculate events per second (rolling window)
    const eventsPerSecond = this.calculateEventsPerSecond(events);
    
    return {
      totalEvents: events.length,
      eventsBySeverity,
      eventsPerSecond
    };
  });
  
  /**
   * Unique sources extracted from all events.
   * Used for filter dropdown population.
   */
  public readonly availableSources = computed(() => {
    const events = this.eventsSignal();
    const sources = new Set<string>();
    events.forEach(event => sources.add(event.source));
    return Array.from(sources).sort();
  });
  
  // ===== PUBLIC READ-ONLY SIGNALS =====
  
  public readonly connectionStatus = this.connectionStatusSignal.asReadonly();
  public readonly activeFilters = this.filtersSignal.asReadonly();
  
  constructor() {
    this.initializeWebSocketConnection();
    this.logStateChanges(); // Debug logging
  }
  
  /**
   * Initialize WebSocket connection and subscribe to events.
   * Bridge between RxJS stream and Signal-based state.
   * 
   * Pattern: Observable -> Signal conversion at service boundary.
   */
  private initializeWebSocketConnection(): void {
    // Subscribe to connection status updates
    this.wsService.connectionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.connectionStatusSignal.set(status);
      });
    
    // Subscribe to incoming events
    this.wsService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.addEvent(event);
      });
    
    // Initiate connection
    this.wsService.connect();
  }
  
  /**
   * Add new event to state with backpressure.
   * Immutable update: create new array instead of mutating.
   * 
   * Backpressure strategy:
   * Keep only last MAX_EVENTS to prevent memory growth.
   * Oldest events are dropped (FIFO queue behavior).
   * 
   * Performance: O(1) amortized due to array slicing.
   */
  private addEvent(event: MonitoringEvent): void {
    this.eventsSignal.update(events => {
      const newEvents = [...events, event];
      
      // Apply backpressure: drop oldest events if limit exceeded
      if (newEvents.length > this.MAX_EVENTS) {
        return newEvents.slice(-this.MAX_EVENTS);
      }
      
      return newEvents;
    });
  }
  
  /**
   * Calculate events per second using sliding time window.
   * 
   * Algorithm:
   * 1. Get current timestamp
   * 2. Filter events within time window
   * 3. Calculate rate: count / window_size
   * 
   * Returns 0 if no recent events.
   */
  private calculateEventsPerSecond(events: readonly MonitoringEvent[]): number {
    if (events.length === 0) return 0;
    
    const now = Date.now();
    const windowStart = now - (this.RATE_WINDOW_SECONDS * 1000);
    
    const recentEvents = events.filter(event => event.timestamp >= windowStart);
    
    return recentEvents.length / this.RATE_WINDOW_SECONDS;
  }
  
  // ===== FILTER MANAGEMENT =====
  
  /**
   * Toggle severity filter.
   * Immutable update: create new Set instead of mutating.
   */
  public toggleSeverityFilter(severity: EventSeverity): void {
    this.filtersSignal.update(filters => {
      const newSeverities = new Set(filters.severities);
      
      if (newSeverities.has(severity)) {
        newSeverities.delete(severity);
      } else {
        newSeverities.add(severity);
      }
      
      return {
        ...filters,
        severities: newSeverities
      };
    });
  }
  
  /**
   * Toggle source filter.
   * Immutable update: create new Set instead of mutating.
   */
  public toggleSourceFilter(source: string): void {
    this.filtersSignal.update(filters => {
      const newSources = new Set(filters.sources);
      
      if (newSources.has(source)) {
        newSources.delete(source);
      } else {
        newSources.add(source);
      }
      
      return {
        ...filters,
        sources: newSources
      };
    });
  }
  
  /**
   * Clear all active filters.
   */
  public clearFilters(): void {
    this.filtersSignal.set({
      severities: new Set(),
      sources: new Set()
    });
  }
  
  /**
   * Debug logging for state changes.
   * Effect runs whenever signals change.
   * 
   * Useful for understanding state flow during development.
   * Remove or disable in production for performance.
   */
  private logStateChanges(): void {
    effect(() => {
      const events = this.eventsSignal();
      const status = this.connectionStatusSignal();
      const filters = this.filtersSignal();
      
      console.log('State update:', {
        eventCount: events.length,
        connectionStatus: status,
        activeFilters: {
          severities: Array.from(filters.severities),
          sources: Array.from(filters.sources)
        }
      });
    });
  }
}
