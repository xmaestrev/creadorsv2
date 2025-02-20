// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoriaComponent } from './pages/categoria/categoria.component';
import { CreatorComponent } from './pages/creator/creator.component';
import { CercarComponent } from './pages/cercar/cercar.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  { path: 'categorias/:id', 
    component: CategoriaComponent
  },
  { path: 'creador', 
    component: CreatorComponent
  },
  { path: 'cercar', 
    component: CercarComponent
  },
];
