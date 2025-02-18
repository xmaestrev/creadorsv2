// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoriaComponent } from './pages/categoria/categoria.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  { path: 'categorias/:id', 
    component: CategoriaComponent
  },
];
