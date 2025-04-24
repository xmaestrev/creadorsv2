import { Component, OnInit } from '@angular/core';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: string = '';
  searchText: string = '';
  selectedSearchType: string = 'all';

  constructor(
    private creatorsService: CreatorsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.selectedCategory = params['categoria'];
      }
    });
  }

  loadCategories(forceRefresh: boolean = false): void {
    this.creatorsService.getCategories(forceRefresh).subscribe({
      next: (cats) => {
        this.categories = cats;
        console.log('Categorías cargadas:', this.categories);
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
      }
    });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selected = target.value;
    this.selectedCategory = selected;
    // Si el valor es vacío (opción "Selecciona una categoría"), redirige a la home.
    if (selected === '') {
      this.router.navigate(['/']);
      this.searchText = '';
      this.selectedSearchType = 'all';
    } else {
      // Si se selecciona "Todas las categorías" u otra categoría, se navega a /cercar
      this.router.navigate(['/cercar'], { queryParams: { categoria: selected } });
    }
  }
  

  goToCercar(): void {
    // Determinamos el valor del parámetro type[] según el select
    let type: string[];
    if (this.selectedSearchType === 'all') {
      type = ['videos', 'creadors'];
    } else {
      type = [this.selectedSearchType];
    }
    // Construimos los query params, incluyendo el valor de selectedSearchType
    const queryParams: any = { 
      text: this.searchText,
      'type[]': type,
      selectedSearchType: this.selectedSearchType  // <-- Asegurarse de incluirlo
    };
    if (this.selectedCategory) {
      queryParams.categoria = this.selectedCategory;
    }
    this.router.navigate(['/cercar'], { queryParams });
  }
  
}
