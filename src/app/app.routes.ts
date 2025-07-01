// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CreatorComponent } from './pages/creator/creator.component';
import { CercarComponent } from './pages/cercar/cercar.component';
import { ReproductorYoutubeComponent } from './reproductor-youtube/reproductor-youtube.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  { path: 'creador', 
    component: CreatorComponent
  },
  { path: 'cercar', 
    component: CercarComponent
  },
  { path: 'video', component: ReproductorYoutubeComponent },
];
