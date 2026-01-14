import { Injectable, inject, DestroyRef } from '@angular/core';
import { Observable, Subject, timer, NEVER } from 'rxjs';
import { 
  webSocket, 
  WebSocketSubject 
} from 'rxjs/webSocket';
import { 
  retryWhen, 
  tap, 
  delayWhen, 
  catchError
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonitoringEvent, ConnectionStatus } from '@core/models/event.model';

/**
 * WebSocket service for real-time event streaming.
 * 
 * Architecture decisions:
 * - RxJS WebSocketSubject for bidirectional communication
 * - Automatic reconnection with exponential backoff
 * - Connection status exposed as Observable for UI reactivity
 * - Clean separation: this service only handles transport layer
 * - State management delegated to dedicated state service
 * 
 * Why RxJS here:
 * WebSocket is inherently asynchronous and stream-based.
 * RxJS provides robust operators for reconnection, backoff, and error handling.
 * This is legitimate use of Observable (not converting everything to streams).
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly destroyRef = inject(DestroyRef);
  
  // WebSocket endpoint - configurable via environment
  private readonly WS_ENDPOINT = 'ws://localhost:8080';
  
  // Reconnection parameters
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds
  
  // Internal WebSocket subject (null when disconnected)
  private socket$: WebSocketSubject<MonitoringEvent> | null = null;
  
  // Connection status stream
  private connectionStatusSubject = new Subject<ConnectionStatus>();
  public readonly connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  // Event stream exposed to consumers
  private eventsSubject = new Subject<MonitoringEvent>();
  public readonly events$ = this.eventsSubject.asObservable();
  
  constructor() {
    // Cleanup on service destruction
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }
  
  /**
   * Establish WebSocket connection with automatic reconnection.
   * 
   * Flow:
   * 1. Create WebSocket subject
   * 2. Set status to 'connecting'
   * 3. Subscribe to incoming messages
   * 4. Handle connection lifecycle events
   * 5. Implement exponential backoff on errors
   * 
   * Error handling:
   * - Network failures trigger reconnection
   * - Invalid messages logged but don't break stream
   * - Max retry limit prevents infinite loops
   */
  public connect(): void {
    if (this.socket$) {
      console.warn('WebSocket already connected');
      return;
    }
    
    this.connectionStatusSubject.next('connecting');
    
    // Create WebSocket subject with reconnection logic
    this.socket$ = webSocket<MonitoringEvent>({
      url: this.WS_ENDPOINT,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
          this.connectionStatusSubject.next('connected');
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.connectionStatusSubject.next('disconnected');
        }
      }
    });
    
    // Subscribe to incoming events with error handling and retry logic
    this.socket$
      .pipe(
        // Log incoming events for debugging
        tap(event => console.log('Event received:', event)),
        
        // Retry with exponential backoff on connection failures
        retryWhen(errors => 
          errors.pipe(
            tap(error => {
              console.error('WebSocket error:', error);
              this.connectionStatusSubject.next('reconnecting');
            }),
            delayWhen((_, attemptIndex) => {
              // Calculate exponential backoff delay
              const delay = Math.min(
                this.INITIAL_RETRY_DELAY * Math.pow(2, attemptIndex),
                this.MAX_RETRY_DELAY
              );
              
              console.log(`Reconnecting in ${delay}ms (attempt ${attemptIndex + 1})`);
              return timer(delay);
            })
          )
        ),
        
        // Catch unrecoverable errors
        catchError(error => {
          console.error('Unrecoverable WebSocket error:', error);
          this.connectionStatusSubject.next('disconnected');
          return NEVER;
        }),
        
        // Auto-cleanup on service destruction using takeUntilDestroyed
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (event) => {
          // Validate event structure before emitting
          if (this.isValidEvent(event)) {
            this.eventsSubject.next(event);
          } else {
            console.warn('Invalid event received:', event);
          }
        },
        error: (error) => {
          console.error('Event stream error:', error);
        }
      });
  }
  
  /**
   * Gracefully close WebSocket connection.
   * Prevents memory leaks and dangling connections.
   */
  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
      this.connectionStatusSubject.next('disconnected');
      console.log('WebSocket disconnected');
    }
  }
  
  /**
   * Type guard for event validation.
   * Ensures received data matches expected structure.
   * 
   * Prevents runtime errors from malformed data.
   */
  private isValidEvent(event: any): event is MonitoringEvent {
    return (
      typeof event === 'object' &&
      event !== null &&
      typeof event.id === 'string' &&
      typeof event.timestamp === 'number' &&
      typeof event.source === 'string' &&
      typeof event.message === 'string' &&
      (event.severity === 'INFO' || event.severity === 'WARNING' || event.severity === 'ERROR')
    );
  }
}
