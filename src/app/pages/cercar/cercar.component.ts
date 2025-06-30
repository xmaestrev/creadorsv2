import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { CreatorsService, Creator } from '../../services/creators.service';

@Component({
  selector: 'app-cercar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cercar.component.html',
  styleUrls: ['./cercar.component.css']
})
export class CercarComponent implements OnInit {
  // Parámetros de búsqueda
  text = '';
  categoria = '';
  selectedSearchType: 'all' | 'videos' | 'creadors' = 'all';
  platform: string[] = [];
  type: string[] = ['creadors', 'videos'];

  // Resultados
  videos: any[] = [];
  creators: any[] = [];
  firstFourVideos: any[] = [];
  restOfVideos: any[] = [];
  firstFourCreators: any[] = [];
  restOfCreators: any[] = [];

  // Control de carga y paginación
  isLoading = false;
  displayedRestVideosCount = 8;
  displayedRestCreatorsCount = 8;

  // Filtros UI
  platformFilter: string = 'all';
  orderFilter: string = 'recent';
  twitchTypeFilter: string = 'all';

  /** Caché de todos los creadores para lookup rápido */
  private allCreators: Creator[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorsService: CreatorsService
  ) {}

  ngOnInit(): void {
    // 1) Precargar todos los creadores
    this.creatorsService.getAllCreators().subscribe({
      next: all => {
        this.allCreators = all;
        // 2) Una vez cargados, leer query params y lanzar la búsqueda
        this.route.queryParams.subscribe(params => {
          this.text = params['text'] || '';
          this.categoria = params['categoria'] || '';
          this.selectedSearchType = (params['selectedSearchType'] as any) || 'all';
          this.type = params['type[]']
            ? (Array.isArray(params['type[]']) ? params['type[]'] : [params['type[]']])
            : ['creadors', 'videos'];
          this.platform = params['platform[]']
            ? (Array.isArray(params['platform[]']) ? params['platform[]'] : [params['platform[]']])
            : [];
          this.loadResults();
        });
      },
      error: err => {
        console.error('No se pudieron cargar los creadores:', err);
        // Aún así procedemos a la búsqueda (concretará a "Unknown")
        this.allCreators = [];
        this.route.queryParams.subscribe(() => this.loadResults());
      }
    });
  }

  private getTypeFromSearchSelect(): string[] {
    return this.selectedSearchType === 'all'
      ? ['videos', 'creadors']
      : [this.selectedSearchType];
  }

  loadResults(): void {
    this.isLoading = true;
    const baseQuery = {
      text: this.text,
      type: this.text
        ? this.getTypeFromSearchSelect()
        : (this.categoria && this.categoria !== 'todas'
            ? ['creadors', 'videos']
            : this.type),
      platform: this.platform,
      categoria: this.text
        ? []
        : ((this.categoria && this.categoria !== 'todas') ? [this.categoria] : [])
    };
  
    // Caso "all" sin texto: se llaman por separado a vídeos y creadores
    if (!this.text && this.selectedSearchType === 'all') {
      const qV = { ...baseQuery, type: ['videos'] };
      const qC = { ...baseQuery, type: ['creadors'] };
      forkJoin({
        videos: this.creatorsService.search(qV),
        creators: this.creatorsService.search(qC)
      }).subscribe({
        next: ({ videos, creators }) => {
          this.videos   = this.extractArray(videos).filter(i => this.isVideo(i));
          this.creators = this.extractArray(creators);
          this.assignCreatorInfo(this.videos);
          this.assignCreatorInfo(this.creators, false);
          this.separateResults();
          this.isLoading = false;
        },
        error: err => {
          console.error('Error en búsqueda separada:', err);
          this.isLoading = false;
        }
      });
      return;
    }
  
    // Caso general
    this.creatorsService.search(baseQuery).subscribe({
      next: data => {
        const all = this.extractArray(data);
        this.videos   = all.filter(i => this.isVideo(i));
        this.creators = all.filter(i => !this.isVideo(i));
  
        // Fallback extra por categoría SOLO para Twitch
        if (!this.text && this.categoria && this.categoria !== 'todas') {
          this.creatorsService.getVideosByCategory(this.categoria, 'twitch').subscribe({
            next: extra => {
              // Aquí eliminamos la búsqueda de extra.videos
              const arr = Array.isArray(extra) ? extra : [];
              this.videos = arr.map(v => this.mapVideo(v));
              this.finishMapping();
            },
            error: () => this.finishMapping()
          });
        } else {
          this.finishMapping();
        }
      },
      error: err => {
        console.error('Error en la cerca:', err);
        this.isLoading = false;
      }
    });
  }
  

  /** Extrae el array propiamente (puede venir en `results` o como array directo) */
  private extractArray(src: any): any[] {
    if (Array.isArray(src)) return src;
    if (src && Array.isArray(src.results)) return src.results;
    return [];
  }

  /** Detecta si un item es vídeo */
  private isVideo(item: any) {
    const url = item.url || item.embed_url;
    return !!url && (url.includes('twitch') || url.includes('youtube'));
  }

  /** Asigna name+image URL desde `allCreators` a cada item */
  private assignCreatorInfo(items: any[], isVideoSection = true) {
    const lookup = this.allCreators.reduce((acc, c) => {
      acc[c.creatorId] = {
        name:     c.name,
        imageUrl: c.imageUrl || 'assets/img/default-creator-profile.png'
      };
      return acc;
    }, {} as Record<string, { name: string; imageUrl: string }>);

    items.forEach(i => {
      const info = lookup[i.creatorId];
      i.creator      = info?.name      || 'Unknown';
      i.creatorImage = info?.imageUrl  || 'assets/img/default-creator-profile.png';
    });
  }

  /** Termina de mapear y divide resultados */
  private finishMapping() {
    this.assignCreatorInfo(this.videos);
    this.assignCreatorInfo(this.creators, false);
    this.applyTypeFilter();
    this.separateResults();
    this.isLoading = false;
  }

  private mapVideo(video: any) {
    let thumb = video.thumbnail_url;
    if (thumb?.includes('%{width}')) {
      thumb = thumb
        .replace(/%\{width\}/g, '320')
        .replace(/%\{height\}/g, '180');
    }
    return {
      video_id:      video.video_id || video.id,
      url:           video.url || video.embed_url,
      thumbnail_url: thumb,
      title:         video.title,
      description:   video.description,
      creatorId:     video.creatorId || video.creator_id,
      duration:      video.duration ? video.duration + 's' : '',
      type:          (video.type || '').toLowerCase()
    };
  }

  private separateResults() {
    this.firstFourVideos    = this.videos.slice(0,4);
    this.restOfVideos       = this.videos.slice(4);
    this.displayedRestVideosCount   = 8;
    this.firstFourCreators  = this.creators.slice(0,4);
    this.restOfCreators     = this.creators.slice(4);
    this.displayedRestCreatorsCount = 8;
  }

  private applyTypeFilter() {
    if (this.selectedSearchType==='videos')   this.creators = [];
    if (this.selectedSearchType==='creadors') this.videos   = [];
  }

  loadMoreVideos()   { this.displayedRestVideosCount   += 8; }
  loadMoreCreators() { this.displayedRestCreatorsCount += 8; }

  navigateToVideo(v: any) {
    if (v.url.includes('youtube')) {
      const id = v.url.split('v=')[1];
      this.router.navigate(['/video'], { queryParams:{ videoID:id, creatorId:v.creatorId }});
    } else {
      window.open(v.url,'_blank','noopener');
    }
  }

  navigateToCreator(c: any) {
    this.router.navigate(['/creador'], { queryParams:{ id:c.creatorId }});
  }
}
