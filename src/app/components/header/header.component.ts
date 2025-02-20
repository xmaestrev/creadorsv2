import { Component, OnInit } from '@angular/core';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: string = '';
  searchText: string = '';

  constructor(
    private creatorsService: CreatorsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    // Actualizamos el select amb el valor del query param "categoria"
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['categoria'] || '';
    });
  }

  loadCategories(forceRefresh = false): void {
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

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedCategory = target.value;
    if (!selectedCategory) {
      this.router.navigate(['/cercar']);
    } else {
      this.router.navigate(['/cercar'], { queryParams: { categoria: selectedCategory } });
    }
  }

  goToCercar(): void {
    this.router.navigate(['/cercar'], { queryParams: { text: this.searchText } });
  }
}
