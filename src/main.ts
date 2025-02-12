import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Importa provideRouter y tus rutas
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    // Si ya tienes providers en appConfig, mantenlos (con el spread ...)
    ...(appConfig.providers ?? []),
    provideRouter(routes), // Inyecta aquí tus rutas
  ],
})
.catch((err) => console.error(err));
