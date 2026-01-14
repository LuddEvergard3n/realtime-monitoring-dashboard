/**
 * Core domain types for the monitoring dashboard.
 * 
 * Design decisions:
 * - Immutable by design (readonly properties)
 * - Severity as union type ensures compile-time safety
 * - Timestamp as number (Unix epoch) for performance and consistent sorting
 * - Source field allows filtering and grouping by origin
 */

/**
 * Event severity levels following industry standards.
 * Maps to visual indicators and filtering logic.
 */
export type EventSeverity = 'INFO' | 'WARNING' | 'ERROR';

/**
 * Immutable monitoring event structure.
 * Represents a single log/metric/alert from the system.
 * 
 * @property id - Unique identifier for deduplication and tracking
 * @property timestamp - Unix epoch milliseconds for consistent sorting
 * @property source - Origin system/service (e.g., 'api-gateway', 'database')
 * @property message - Human-readable event description
 * @property severity - Categorization for filtering and visualization
 */
export interface MonitoringEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly source: string;
  readonly message: string;
  readonly severity: EventSeverity;
}

/**
 * WebSocket connection state machine.
 * Explicit states prevent race conditions in reconnection logic.
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Filter criteria for event display.
 * Undefined values mean "no filter applied" (show all).
 * 
 * Design: Simple object instead of complex query builder.
 * Sufficient for current requirements, easily extensible.
 */
export interface EventFilters {
  readonly severities: Set<EventSeverity>;
  readonly sources: Set<string>;
}

/**
 * Derived metrics computed from event stream.
 * All values are computed, never mutated directly.
 * 
 * @property totalEvents - Cumulative count since connection
 * @property eventsBySeverity - Distribution map for pie charts
 * @property eventsPerSecond - Rolling average for rate monitoring
 */
export interface EventMetrics {
  readonly totalEvents: number;
  readonly eventsBySeverity: Record<EventSeverity, number>;
  readonly eventsPerSecond: number;
}

/**
 * Complete dashboard state snapshot.
 * Immutable structure enables predictable state transitions.
 * 
 * Design rationale:
 * - Single source of truth
 * - All state in one place for debugging
 * - Derived data computed via signals, not stored
 */
export interface DashboardState {
  readonly connectionStatus: ConnectionStatus;
  readonly events: readonly MonitoringEvent[];
  readonly filters: EventFilters;
  readonly lastEventTimestamp: number | null;
}
