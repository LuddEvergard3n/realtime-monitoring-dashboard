import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '@core/services/dashboard-state.service';
import { ConnectionStatus } from '@core/models/event.model';

/**
 * Connection status indicator component.
 * 
 * Responsibilities:
 * - Display current WebSocket connection state
 * - Visual feedback via color-coded badge
 * - Real-time updates as connection changes
 * 
 * Architecture:
 * - Pure presentation component
 * - Reads connection status from state service
 * - No business logic
 * 
 * Performance:
 * - OnPush change detection
 * - Minimal re-renders (only when connection status changes)
 * 
 * UX Design:
 * - Fixed position (top-right) for constant visibility
 * - Color-coded: green (connected), yellow (connecting/reconnecting), red (disconnected)
 * - Animated pulse effect for connecting/reconnecting states
 */
@Component({
  selector: 'app-connection-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionIndicatorComponent {
  private readonly stateService = inject(DashboardStateService);
  
  // Connection status from state service (readonly signal)
  protected readonly connectionStatus = this.stateService.connectionStatus;
  
  /**
   * Get display label for connection status.
   * User-friendly text representation.
   */
  protected getStatusLabel(status: ConnectionStatus): string {
    const labels: Record<ConnectionStatus, string> = {
      connected: 'Connected',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...',
      disconnected: 'Disconnected'
    };
    
    return labels[status];
  }
  
  /**
   * Get CSS class for status badge styling.
   * Maps status to visual appearance.
   */
  protected getStatusClass(status: ConnectionStatus): string {
    return `connection-indicator__badge--${status}`;
  }
}
