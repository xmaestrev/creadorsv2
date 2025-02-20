import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CreatorsService } from '../../services/creators.service';

@Component({
  selector: 'app-cercar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cercar.component.html',
  styleUrls: ['./cercar.component.css']
})
export class CercarComponent implements OnInit {
  // Paràmetres de cerca (query params)
  categoria: string = '';

  // Arrays complets de resultats
  videos: any[] = [];
  creators: any[] = [];

  // Arrays per a les dues seccions
  firstFourVideos: any[] = [];
  restOfVideos: any[] = [];
  firstFourCreators: any[] = [];
  restOfCreators: any[] = [];

  // Control per mostrar "Veure més"
  displayedRestVideosCount: number = 8;
  displayedRestCreatorsCount: number = 8;

  isLoading: boolean = false;

  // Filtres visuals (opcionals)
  platformFilter: string = 'all';  // 'all', 'twitch', 'youtube'
  orderFilter: string = 'recent';  // 'recent', 'oldest'
  twitchTypeFilter: string = 'all';  // 'all', 'clip', 'emission'

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorsService: CreatorsService
  ) {}

  ngOnInit(): void {
    // Llegim el query param "categoria", p.e., /cercar?categoria=2
    this.route.queryParams.subscribe(params => {
      this.categoria = params['categoria'] || '';
      if (this.categoria) {
        this.loadResults();
      } else {
        // Si no hi ha categoria, es buida tot
        this.videos = [];
        this.creators = [];
        this.firstFourVideos = [];
        this.restOfVideos = [];
        this.firstFourCreators = [];
        this.restOfCreators = [];
      }
    });
  }

  loadResults(): void {
    this.isLoading = true;
    forkJoin({
      videos: this.creatorsService.getVideosByCategory(this.categoria, 'twitch'),
      creators: this.creatorsService.search({
        text: '',
        type: ['creadors'],
        categoria: [this.categoria]
      })
    }).subscribe({
      next: (data: any) => {
        // Processar vídeos
        if (Array.isArray(data.videos)) {
          // Si la resposta és directament un array
          this.videos = data.videos.map((video: any) => this.mapVideo(video));
        } else if (data.videos && Array.isArray(data.videos.videos)) {
          // Si la resposta és un objecte amb propietat "videos"
          this.videos = data.videos.videos.map((video: any) => this.mapVideo(video));
        } else {
          this.videos = [];
        }
        console.log('Total vídeos:', this.videos.length);

        // Separar els primers 4 i la resta per vídeos
        this.firstFourVideos = this.videos.slice(0, 4);
        this.restOfVideos = this.videos.slice(4);
        this.displayedRestVideosCount = 8;

        console.log("jdhsdkjghsd:" + this.firstFourVideos)

        // Processar creadors
        if (Array.isArray(data.creators)) {
          this.creators = data.creators;
        } else if (data.creators && Array.isArray(data.creators.results)) {
          this.creators = data.creators.results;
        } else {
          this.creators = [];
        }
        console.log('Total creadors:', this.creators.length);

        // Separar els primers 4 i la resta per creadors
        this.firstFourCreators = this.creators.slice(0, 4);
        this.restOfCreators = this.creators.slice(4);
        this.displayedRestCreatorsCount = 8;

        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al carregar resultats:', err);
        this.isLoading = false;
      }
    });
  }

  private mapVideo(video: any) {
    let finalThumb = video.thumbnail_url;
    if (finalThumb && finalThumb.includes('%{width}')) {
      finalThumb = finalThumb.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180');
    }
    return {
      video_id: video.video_id,
      url: video.url,
      thumbnail_url: finalThumb,
      title: video.title || 'Sense títol',
      description: video.description || '',
      creatorId: video.creatorId || '',
      duration: video.duration ? video.duration + 's' : '',
      type: video.type ? video.type.toLowerCase() : '' // ex: "clip"
    };
  }

  applyFilters(): void {
    // Aquí pots afegir filtres addicionals si cal.
    // Per ara, no realitzem filtres addicionals.
  }

  loadMoreVideos(): void {
    this.displayedRestVideosCount += 8;
  }

  loadMoreCreators(): void {
    this.displayedRestCreatorsCount += 8;
  }

  navigateToVideo(video: any): void {
    if (video.url && video.url.includes('youtube')) {
      const videoID = video.url.split('v=')[1];
      this.router.navigate(['/video'], { queryParams: { videoID, creatorId: video.creatorId } });
    } else {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  }

  navigateToCreator(creator: any): void {
    this.router.navigate(['/creador'], { queryParams: { id: creator.creatorId } });
  }
}
