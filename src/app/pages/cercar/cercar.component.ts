import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { CreatorsService } from '../../services/creators.service';

@Component({
  selector: 'app-cercar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cercar.component.html',
  styleUrls: ['./cercar.component.css']
})
export class CercarComponent implements OnInit {
  // Query params
  text: string = '';
  categoria: string = '';
  // Valor por defecto para la búsqueda sin texto
  type: string[] = ['creadors', 'videos'];
  platform: string[] = [];

  // Nuevo select para tipo de búsqueda: "all", "videos" o "creadors"
  selectedSearchType: string = 'all';

  // Resultados completos
  videos: any[] = [];
  creators: any[] = [];

  // División en dos grupos
  firstFourVideos: any[] = [];
  restOfVideos: any[] = [];
  firstFourCreators: any[] = [];
  restOfCreators: any[] = [];

  // Control para "Ver más"
  displayedRestVideosCount: number = 8;
  displayedRestCreatorsCount: number = 8;

  isLoading: boolean = false;

  // Filtros visuales adicionales (opcionales)
  platformFilter: string = 'all';  // 'all', 'twitch', 'youtube'
  orderFilter: string = 'recent';  // 'recent', 'oldest'
  twitchTypeFilter: string = 'all';  // 'all', 'clip', 'emission'

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorsService: CreatorsService
  ) {}

  ngOnInit(): void {
    // Se leen los query params: text, categoria, type[] y selectedSearchType
    this.route.queryParams.subscribe(params => {
      this.text = params['text'] || '';
      this.categoria = params['categoria'] || '';
      this.selectedSearchType = params['selectedSearchType'] || 'all';
      this.type = params['type[]']
        ? (Array.isArray(params['type[]']) ? params['type[]'] : [params['type[]']])
        : ['creadors', 'videos'];
      this.platform = params['platform[]']
        ? (Array.isArray(params['platform[]']) ? params['platform[]'] : [params['platform[]']])
        : [];
      this.loadResults();
    });
  }

  private getTypeFromSearchSelect(): string[] {
    if (this.selectedSearchType === 'all') {
      return ['videos', 'creadors'];
    } else {
      return [this.selectedSearchType];
    }
  }

  loadResults(): void {
    this.isLoading = true;
    const query = {
      text: this.text,
      // Si hay texto, usamos el valor del select; si no, se filtra por categoría
      type: this.text ? this.getTypeFromSearchSelect() : (this.categoria ? ['creadors', 'videos'] : this.type),
      platform: this.platform,
      // Si hay texto, ignoramos la categoría; si no, se aplica
      categoria: this.text ? [] : (this.categoria ? [this.categoria] : [])
    };

    this.creatorsService.search(query).subscribe({
      next: (data) => {
        let resultsArray: any[] = [];
        if (Array.isArray(data)) {
          resultsArray = data;
        } else if (data && Array.isArray(data.results)) {
          resultsArray = data.results;
        }
        if (this.text) {
          // Con texto, filtramos: items con URL (o embed_url) son vídeos, el resto son creadores
          this.videos = resultsArray.filter(item => {
            const videoUrl = item.url || item.embed_url;
            return videoUrl && (videoUrl.includes('twitch') || videoUrl.includes('youtube'));
          });
          this.creators = resultsArray.filter(item => !(item.url || item.embed_url));
        } else {
          this.videos = resultsArray.filter(item => {
            const videoUrl = item.url || item.embed_url;
            return videoUrl && (videoUrl.includes('twitch') || videoUrl.includes('youtube'));
          });
          this.creators = resultsArray.filter(item => !(item.url || item.embed_url));
        }
        // Si no hay texto y hay categoría, se hace una llamada extra para vídeos de Twitch
        if (!this.text && this.categoria) {
          this.creatorsService.getVideosByCategory(this.categoria, 'twitch').subscribe({
            next: (vidData: any) => {
              let additionalVideos: any[] = [];
              if (Array.isArray(vidData)) {
                additionalVideos = vidData.map((video: any) => this.mapVideo(video));
              } else if (vidData && Array.isArray(vidData.videos)) {
                additionalVideos = vidData.videos.map((video: any) => this.mapVideo(video));
              }
              if (additionalVideos.length > 0) {
                this.videos = additionalVideos;
              }
              // Mapear IDs a nombres para vídeos
              this.mapCreatorIdsToNames(this.videos).subscribe({
                next: () => {
                  this.separateResults();
                  this.isLoading = false;
                },
                error: () => {
                  this.separateResults();
                  this.isLoading = false;
                }
              });
            },
            error: (err) => {
              console.error('Error en getVideosByCategory:', err);
              this.separateResults();
              this.isLoading = false;
            }
          });
        } else {
          // Mapear nombres en vídeos (para que se actualice la propiedad creator)
          this.mapCreatorIdsToNames(this.videos).subscribe({
            next: () => {
              this.separateResults();
              this.isLoading = false;
            },
            error: () => {
              this.separateResults();
              this.isLoading = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error en la cerca:', err);
        this.isLoading = false;
      }
    });
  }

  private separateResults(): void {
    // Divide los vídeos y creadores en dos bloques: primeros 4 y resto
    this.firstFourVideos = this.videos.slice(0, 4);
    this.restOfVideos = this.videos.slice(4);
    this.displayedRestVideosCount = 8;
    this.firstFourCreators = this.creators.slice(0, 4);
    this.restOfCreators = this.creators.slice(4);
    this.displayedRestCreatorsCount = 8;
  }

  private mapVideo(video: any) {
    let finalThumb = video.thumbnail_url;
    if (finalThumb && finalThumb.includes('%{width}')) {
      finalThumb = finalThumb.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180');
    }
    return {
      video_id: video.video_id || video.id,
      url: video.url || video.embed_url,
      thumbnail_url: finalThumb,
      title: video.title || 'Sense títol',
      description: video.description || '',
      creatorId: video.creatorId || video.creator_id || '',
      duration: video.duration ? video.duration + 's' : '',
      type: video.type ? video.type.toLowerCase() : ''
    };
  }

  private mapCreatorIdsToNames(items: any[]): any {
    const distinctIds = Array.from(new Set(items.map(i => i.creatorId).filter(x => x)));
    if (distinctIds.length === 0) {
      return of(null);
    }
    const calls = distinctIds.map(id => this.creatorsService.getCreatorById(id));
    return forkJoin(calls).pipe(
      mergeMap((creatorsData: any[]) => {
        const nameMap: Record<string, string> = {};
        creatorsData.forEach(c => {
          if (c && c.creatorId) {
            nameMap[c.creatorId] = c.name;
          }
        });
        items.forEach(item => {
          if (item.creatorId && nameMap[item.creatorId]) {
            item.creator = nameMap[item.creatorId];
          } else {
            item.creator = 'Unknown';
          }
        });
        return of(true);
      })
    );
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

  navigateToCreator(creatorId: any): void {
    if (creatorId) {
      this.router.navigate(['/creador'], { queryParams: { id: creatorId } });
    } else {
      console.warn('El item no tiene creatorId definido.');
    }
  }

  applyFilters(): void {
    // Aquí puedes aplicar filtros adicionales si es necesario; de momento se deja vacío.
  }
}
