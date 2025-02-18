import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Importa provideRouter y tus rutas
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Importa provideHttpClient
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    // Mantiene los providers existentes
    ...(appConfig.providers ?? []),
    provideRouter(routes), // Inyecta rutas
    provideHttpClient(), // <-- ¡Agrega esto para solucionar el error!
  ],
})
  .catch((err) => console.error(err));
