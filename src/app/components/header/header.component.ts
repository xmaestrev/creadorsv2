import { Component, OnInit } from '@angular/core';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  categories: any[]   = [];
  selectedCategory    = '';
  searchText          = '';
  selectedSearchType  = 'all';

  constructor(
    private creatorsService: CreatorsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* ========== INIT ========== */
  ngOnInit(): void {
    this.loadCategories();
    /*  sincronizamos el combo con la URL */
    this.route.queryParams.subscribe(p => {
      this.selectedCategory = p['categoria'] ?? '';
    });
  }

  /* ========== CATEGORIES ========== */
  loadCategories(forceRefresh = false): void {
    this.creatorsService.getCategories(forceRefresh).subscribe({
      next: (cats) => (this.categories = cats),
      error: (err)  => console.error('Error cargando categorías:', err),
    });
  }

  /* ========== COMBOS Y BUSCAR ========== */

  /** Cambio en el combo de categorías */
  onCategoryChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.selectedCategory = selected;

    if (selected === '') {
      /* vuelve a la home */
      this.router.navigate(['/']);
      this.searchText = '';
      this.selectedSearchType = 'all';
      return;
    }

    if (selected === 'todas') {
      /* “Totes les categories” ⇢ /cercar SIN parámetro */
      this.router.navigate(['/cercar']);
    } else {
      this.router.navigate(['/cercar'], { queryParams:{ categoria:selected }});
    }
  }

  /** Click en el botón “Cercar” */
  goToCercar(): void {
    const type =
      this.selectedSearchType === 'all'
        ? ['videos', 'creadors']
        : [this.selectedSearchType];

    const queryParams: any = {
      text: this.searchText,
      'type[]': type,
      selectedSearchType: this.selectedSearchType,
    };

    /* solo añadimos categoria cuando sea válida */
    if (this.selectedCategory && this.selectedCategory !== 'todas') {
      queryParams.categoria = this.selectedCategory;
    }

    this.router.navigate(['/cercar'], { queryParams });
  }
}
