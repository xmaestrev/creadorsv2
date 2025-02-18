import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent implements OnInit {

  categoryId!: string;
  categoryTitle: string = '';
  originalVideos: any[] = []; // Videos combinados sin filtrar
  videos: any[] = [];         // Videos filtrados para mostrar
  isLoading = true;

  // Filtros
  platformFilter: string = '';
  orderFilter: string = '';
  twitchTypeFilter: string = '';

  constructor(
    private route: ActivatedRoute,
    private creatorsService: CreatorsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.categoryId = id;
        this.loadVideos();
      } else {
        console.error('⚠️ No se encontró un ID de categoría en la URL');
      }
    });
  }

  loadVideos() {
    this.isLoading = true;
    if (this.categoryId) {
      forkJoin({
        twitch: this.creatorsService.getVideosByCategory(this.categoryId, 'twitch'),
        youtube: this.creatorsService.getVideosByCategory(this.categoryId, 'youtube')
      }).subscribe({
        next: (response: any) => {
          let twitchVideos: any[] = [];
          let youtubeVideos: any[] = [];

          // Procesar respuesta de Twitch
          if (response.twitch) {
            if (Array.isArray(response.twitch.videos)) {
              twitchVideos = response.twitch.videos.map((video: any) => ({
                url: video.url,
                thumbnail: video.thumbnail_url && video.thumbnail_url.includes('%{width}')
                  ? video.thumbnail_url.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180')
                  : video.thumbnail_url,
                title: video.title,
                description: video.description || 'No description available',
                creator: video.autor || 'Unknown',
                duration: video.duration ? video.duration + 's' : '',
                type: (video.type || '').toLowerCase() // e.g., "clip"
              }));
            } else if (Array.isArray(response.twitch)) {
              twitchVideos = response.twitch.map((video: any) => ({
                url: video.url,
                thumbnail: video.thumbnail_url && video.thumbnail_url.includes('%{width}')
                  ? video.thumbnail_url.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180')
                  : video.thumbnail_url,
                title: video.title,
                description: video.description || 'No description available',
                creator: video.autor || 'Unknown',
                duration: video.duration ? video.duration + 's' : '',
                type: (video.type || '').toLowerCase()
              }));
            }
          }
          // Procesar respuesta de YouTube
          if (response.youtube) {
            if (Array.isArray(response.youtube.videos)) {
              youtubeVideos = response.youtube.videos.map((video: any) => ({
                url: `https://www.youtube.com/watch?v=${video.video_id}`,
                thumbnail: video.thumbnail_url,
                title: video.title,
                description: video.description || 'No description available',
                creator: video.creatorName || 'Unknown',
                duration: video.duration ? video.duration + 's' : '',
                type: 'youtube'
              }));
            } else if (Array.isArray(response.youtube)) {
              youtubeVideos = response.youtube.map((video: any) => ({
                url: `https://www.youtube.com/watch?v=${video.video_id}`,
                thumbnail: video.thumbnail_url,
                title: video.title,
                description: video.description || 'No description available',
                creator: video.creatorName || 'Unknown',
                duration: video.duration ? video.duration + 's' : '',
                type: 'youtube'
              }));
            }
          }
          // Combinar ambos arrays
          this.originalVideos = [...twitchVideos, ...youtubeVideos];
          // Aplicar filtros iniciales
          this.applyFilters();
          this.isLoading = false;

          console.log('✅ Videos cargados:', this.videos);
        },
        error: (err) => {
          console.error('❌ Error al cargar videos de la categoría:', err);
          this.isLoading = false;
        }
      });
    }
  }

  applyFilters() {
    let filtered = [...this.originalVideos];

    // Filtrar por plataforma
    if (this.platformFilter === 'twitch') {
      filtered = filtered.filter(video => video.url.includes('twitch'));
    } else if (this.platformFilter === 'youtube') {
      filtered = filtered.filter(video => video.url.includes('youtube'));
    }

    // Filtrar por tipo de Twitch si corresponde (solo se aplica a videos de Twitch)
    if (this.platformFilter === 'twitch' || this.platformFilter === 'all') {
      filtered = filtered.filter(video => {
        if (video.type === 'youtube') return true;
        if (this.twitchTypeFilter === 'all') return true;
        if (this.twitchTypeFilter === 'clip') {
          return video.type === 'clip';
        } else if (this.twitchTypeFilter === 'emission') {
          return video.type !== 'clip';
        }
        return true;
      });
    }

    // Ordenar (como proxy, se ordena por título, ya que no contamos con fecha)
    if (this.orderFilter === 'recent') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (this.orderFilter === 'oldest') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    this.videos = filtered;
  }

  navigateToVideo(videoUrl: string, creatorId: string): void {
    // Para YouTube se navega a la vista de video; para Twitch se abre en una nueva pestaña
    if (videoUrl.includes('youtube')) {
      this.router.navigate(['/video'], {
        queryParams: { videoID: videoUrl.split('v=')[1], creatorId }
      });
    } else {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
