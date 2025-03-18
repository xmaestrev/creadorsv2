import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreatorsService } from '../../services/creators.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: string = '';

  // Camps del formulari de cerca
  searchText: string = '';
  // Nou select per tipus de cerca: "all", "videos" o "creadors"
  selectedSearchType: string = 'all';

  constructor(
    private creatorsService: CreatorsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    // Actualitza el select amb el valor del query param "categoria" si existeix
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
    if (selected) {
      this.router.navigate(['/cercar'], { queryParams: { categoria: selected } });
    } else {
      this.router.navigate(['/cercar']);
    }
  }

  goToCercar(): void {
    let type: string[];
    if (this.selectedSearchType === 'all') {
      type = ['videos', 'creadors'];
    } else {
      type = [this.selectedSearchType];  // per exemple, ['videos'] si s'ha triat "videos"
    }
    const queryParams: any = {
      text: this.searchText,
      'type[]': type,
      selectedSearchType: this.selectedSearchType // incloure aquest paràmetre
    };
    if (this.selectedCategory) {
      queryParams.categoria = this.selectedCategory;
    }
    console.log('Query params:', queryParams);
    this.router.navigate(['/cercar'], { queryParams });
  }
  
  
}
