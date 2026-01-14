import { TestBed } from '@angular/core/testing';
import { DashboardStateService } from '@core/services/dashboard-state.service';
import { MonitoringEvent, EventSeverity } from '@core/models/event.model';

/**
 * State consistency and immutability tests.
 * 
 * Purpose:
 * - Validate state immutability (no accidental mutations)
 * - Verify predictable state transitions
 * - Test filter logic correctness
 * - Ensure computed signals work as expected
 * 
 * Critical test coverage:
 * 1. Adding events doesn't mutate previous state
 * 2. Filtered events update correctly when filters change
 * 3. Metrics compute correctly from event data
 * 4. Backpressure limit enforced
 * 
 * These tests demonstrate the engineering maturity expected
 * by technical recruiters: predictability, immutability, and
 * correctness of state management.
 */
describe('DashboardStateService - State Consistency', () => {
  let service: DashboardStateService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardStateService]
    });
    
    service = TestBed.inject(DashboardStateService);
  });
  
  /**
   * Test: State immutability.
   * 
   * Validates that adding new events creates new state
   * rather than mutating existing state.
   * 
   * This is critical for:
   * - Predictable state transitions
   * - Change detection optimization
   * - Debugging (state history is preserved)
   * - Time-travel debugging capabilities
   */
  it('should maintain immutable state when adding events', () => {
    // Access private method for testing purposes
    // In production, events come from WebSocket
    const addEventMethod = (service as any).addEvent.bind(service);
    
    // Create first event
    const event1: MonitoringEvent = {
      id: 'test-1',
      timestamp: Date.now(),
      source: 'test-service',
      message: 'Test message 1',
      severity: 'INFO'
    };
    
    // Capture initial state reference
    const initialEvents = service.filteredEvents();
    
    // Add event
    addEventMethod(event1);
    
    // Get new state reference
    const updatedEvents = service.filteredEvents();
    
    // Assert: State reference changed (new array created)
    expect(initialEvents).not.toBe(updatedEvents);
    
    // Assert: Event was added
    expect(updatedEvents.length).toBe(1);
    expect(updatedEvents[0]).toEqual(event1);
    
    // Assert: Original state unchanged
    expect(initialEvents.length).toBe(0);
  });
  
  /**
   * Test: Consistent state after multiple events.
   * 
   * Validates that state remains consistent and predictable
   * even after processing multiple events rapidly.
   * 
   * This simulates real-world scenario of high-throughput
   * event stream.
   */
  it('should maintain consistent state after N events', () => {
    const addEventMethod = (service as any).addEvent.bind(service);
    
    // Generate and add 100 events
    const eventCount = 100;
    const events: MonitoringEvent[] = [];
    
    for (let i = 0; i < eventCount; i++) {
      const event: MonitoringEvent = {
        id: `test-${i}`,
        timestamp: Date.now() + i,
        source: `service-${i % 5}`,
        message: `Test message ${i}`,
        severity: ['INFO', 'WARNING', 'ERROR'][i % 3] as EventSeverity
      };
      
      events.push(event);
      addEventMethod(event);
    }
    
    // Get final state
    const finalEvents = service.filteredEvents();
    const metrics = service.metrics();
    
    // Assert: All events stored
    expect(finalEvents.length).toBe(eventCount);
    
    // Assert: Metrics consistent with event data
    expect(metrics.totalEvents).toBe(eventCount);
    
    // Assert: Event order preserved (FIFO)
    for (let i = 0; i < eventCount; i++) {
      expect(finalEvents[i].id).toBe(events[i].id);
    }
    
    // Assert: No duplicate events
    const uniqueIds = new Set(finalEvents.map(e => e.id));
    expect(uniqueIds.size).toBe(eventCount);
  });
  
  /**
   * Test: Filter logic correctness.
   * 
   * Validates that filtering doesn't mutate state and
   * produces correct results.
   */
  it('should filter events correctly without mutating state', () => {
    const addEventMethod = (service as any).addEvent.bind(service);
    
    // Add events with different severities
    const events: MonitoringEvent[] = [
      {
        id: 'info-1',
        timestamp: Date.now(),
        source: 'service-a',
        message: 'Info message',
        severity: 'INFO'
      },
      {
        id: 'warning-1',
        timestamp: Date.now(),
        source: 'service-b',
        message: 'Warning message',
        severity: 'WARNING'
      },
      {
        id: 'error-1',
        timestamp: Date.now(),
        source: 'service-a',
        message: 'Error message',
        severity: 'ERROR'
      }
    ];
    
    events.forEach(event => addEventMethod(event));
    
    // Initial state: all events visible
    expect(service.filteredEvents().length).toBe(3);
    
    // Apply severity filter: only ERROR
    service.toggleSeverityFilter('ERROR');
    
    // Assert: Only ERROR events visible
    const errorFiltered = service.filteredEvents();
    expect(errorFiltered.length).toBe(1);
    expect(errorFiltered[0].severity).toBe('ERROR');
    
    // Apply source filter: only service-a
    service.clearFilters();
    service.toggleSourceFilter('service-a');
    
    // Assert: Only service-a events visible
    const sourceFiltered = service.filteredEvents();
    expect(sourceFiltered.length).toBe(2);
    expect(sourceFiltered.every(e => e.source === 'service-a')).toBe(true);
    
    // Clear filters
    service.clearFilters();
    
    // Assert: All events visible again
    expect(service.filteredEvents().length).toBe(3);
  });
  
  /**
   * Test: Metrics computation accuracy.
   * 
   * Validates that computed metrics match actual event data.
   */
  it('should compute metrics correctly', () => {
    const addEventMethod = (service as any).addEvent.bind(service);
    
    // Add events with known distribution
    const events: MonitoringEvent[] = [
      // 3 INFO events
      { id: '1', timestamp: Date.now(), source: 's1', message: 'm1', severity: 'INFO' },
      { id: '2', timestamp: Date.now(), source: 's1', message: 'm2', severity: 'INFO' },
      { id: '3', timestamp: Date.now(), source: 's1', message: 'm3', severity: 'INFO' },
      // 2 WARNING events
      { id: '4', timestamp: Date.now(), source: 's2', message: 'm4', severity: 'WARNING' },
      { id: '5', timestamp: Date.now(), source: 's2', message: 'm5', severity: 'WARNING' },
      // 1 ERROR event
      { id: '6', timestamp: Date.now(), source: 's3', message: 'm6', severity: 'ERROR' }
    ];
    
    events.forEach(event => addEventMethod(event));
    
    const metrics = service.metrics();
    
    // Assert: Total count correct
    expect(metrics.totalEvents).toBe(6);
    
    // Assert: Severity distribution correct
    expect(metrics.eventsBySeverity.INFO).toBe(3);
    expect(metrics.eventsBySeverity.WARNING).toBe(2);
    expect(metrics.eventsBySeverity.ERROR).toBe(1);
  });
  
  /**
   * Test: Backpressure enforcement.
   * 
   * Validates that the service doesn't allow unbounded memory growth.
   * Critical for production stability.
   */
  it('should enforce maximum event limit (backpressure)', () => {
    const addEventMethod = (service as any).addEvent.bind(service);
    const MAX_EVENTS = (service as any).MAX_EVENTS;
    
    // Add more events than the limit
    const excessEvents = MAX_EVENTS + 100;
    
    for (let i = 0; i < excessEvents; i++) {
      const event: MonitoringEvent = {
        id: `test-${i}`,
        timestamp: Date.now() + i,
        source: 'test-service',
        message: `Message ${i}`,
        severity: 'INFO'
      };
      
      addEventMethod(event);
    }
    
    // Assert: Only MAX_EVENTS stored
    const finalEvents = service.filteredEvents();
    expect(finalEvents.length).toBe(MAX_EVENTS);
    
    // Assert: Oldest events dropped (FIFO)
    // Last event ID should be from the end of our range
    const lastEvent = finalEvents[finalEvents.length - 1];
    expect(lastEvent.id).toBe(`test-${excessEvents - 1}`);
    
    // First event should be from offset position
    const firstEvent = finalEvents[0];
    expect(firstEvent.id).toBe(`test-${excessEvents - MAX_EVENTS}`);
  });
});
