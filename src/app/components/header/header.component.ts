import { Component, OnInit } from '@angular/core';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

    categories: any[] = [];

    constructor(private creatorsService: CreatorsService, private router: Router) {}
  
    ngOnInit(): void {
      this.loadCategories();
    }
  
    loadCategories(forceRefresh = false) {
      this.creatorsService.getCategories(forceRefresh).subscribe({
        next: (cats) => {
          this.categories = cats;
          console.log('Categorías cargadas:', this.categories);
        },
        error: (err) => {
          console.error('Error al cargar categorías', err);
        },
      });
    }

    onCategoryChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const categoryId = target.value;
      
        if (!categoryId) {
          // Si no hay categoría seleccionada, redirige a la Home
          this.router.navigate(['/']);
        } else {
          // Si hay categoría seleccionada, redirige a la página de esa categoría
          this.router.navigate(['/categorias', categoryId]);
        }
      }
      
      
}
