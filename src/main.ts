import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';

/**
 * Application bootstrap.
 * 
 * Modern Angular approach:
 * - Standalone components (no NgModule)
 * - Provider-based configuration
 * - Tree-shakeable by default
 * 
 * Providers:
 * - Animations: Required for Angular CDK and Material components
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations()
  ]
}).catch(err => console.error(err));
