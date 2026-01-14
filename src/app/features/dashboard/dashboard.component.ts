import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '@features/sidebar/sidebar.component';
import { EventListComponent } from '@features/event-list/event-list.component';
import { MetricsPanelComponent } from '@features/metrics-panel/metrics-panel.component';
import { ConnectionIndicatorComponent } from '@features/connection-indicator/connection-indicator.component';

/**
 * Root dashboard component.
 * 
 * Responsibilities:
 * - Layout structure (grid/flexbox)
 * - Compose feature components
 * - NO business logic (pure presentation)
 * 
 * Architecture:
 * - Standalone component (no NgModule)
 * - OnPush change detection for performance
 * - Delegates all state to child components via services
 * 
 * Layout design:
 * - Sidebar (filters) on left
 * - Main content area (event list) in center
 * - Metrics panel on top
 * - Connection indicator fixed top-right
 * 
 * Why OnPush:
 * - Reduces unnecessary change detection cycles
 * - Signals automatically trigger updates when needed
 * - No manual ChangeDetectorRef management required
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    EventListComponent,
    MetricsPanelComponent,
    ConnectionIndicatorComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}
