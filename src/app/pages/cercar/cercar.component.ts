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
  text: string = '';
  categoria: string = '';
  type: string[] = ['creadors', 'videos'];
  platform: string[] = [];
  selectedSearchType: string = 'all';
  
  videos: any[] = [];
  creators: any[] = [];
  
  firstFourVideos: any[] = [];
  restOfVideos: any[] = [];
  firstFourCreators: any[] = [];
  restOfCreators: any[] = [];
  
  displayedRestVideosCount: number = 8;
  displayedRestCreatorsCount: number = 8;
  
  isLoading: boolean = false;
  
  platformFilter: string = 'all';
  orderFilter: string = 'recent';
  twitchTypeFilter: string = 'all';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorsService: CreatorsService
  ) {}
  
  ngOnInit(): void {
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
    return this.selectedSearchType === 'all' ? ['videos', 'creadors'] : [this.selectedSearchType];
  }
  
  loadResults(): void {
    this.isLoading = true;
    const query = {
      text: this.text,
      type: this.text
              ? this.getTypeFromSearchSelect()
              : (this.categoria && this.categoria !== 'todas'
                  ? ['creadors', 'videos']
                  : this.type),
      platform: this.platform,
      categoria: this.text ? [] : ((this.categoria && this.categoria !== 'todas') ? [this.categoria] : [])
    };
  
    // Si no hay texto y el filtro es "all", se realizan dos llamadas separadas para vídeos y creadores
    if (!this.text && this.selectedSearchType === 'all') {
      const videosQuery = { ...query, type: ['videos'] };
      const creatorsQuery = { ...query, type: ['creadors'] };
      forkJoin({
        videos: this.creatorsService.search(videosQuery),
        creators: this.creatorsService.search(creatorsQuery)
      }).subscribe({
        next: (data) => {
          let videosArray: any[] = [];
          let creatorsArray: any[] = [];
          if (Array.isArray(data.videos)) {
            videosArray = data.videos;
          } else if (data.videos && Array.isArray(data.videos.results)) {
            videosArray = data.videos.results;
          }
          if (Array.isArray(data.creators)) {
            creatorsArray = data.creators;
          } else if (data.creators && Array.isArray(data.creators.results)) {
            creatorsArray = data.creators.results;
          }
          this.videos = videosArray.filter(item => {
            const videoUrl = item.url || item.embed_url;
            return videoUrl && (videoUrl.includes('twitch') || videoUrl.includes('youtube'));
          });
          this.creators = creatorsArray;
          this.mapCreatorIdsToNames(this.videos).subscribe({
            next: () => {
              this.mapCreatorIdsToNames(this.creators).subscribe({
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
            error: () => {
              this.separateResults();
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error en búsqueda separada:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Caso combinado (con texto o filtro específico)
      this.creatorsService.search(query).subscribe({
        next: (data) => {
          let resultsArray: any[] = [];
          if (Array.isArray(data)) {
            resultsArray = data;
          } else if (data && Array.isArray(data.results)) {
            resultsArray = data.results;
          }
          // Separar vídeos y creadores según presencia de URL o embed_url
          this.videos = resultsArray.filter(item => {
            const videoUrl = item.url || item.embed_url;
            return videoUrl && (videoUrl.includes('twitch') || videoUrl.includes('youtube'));
          });
          this.creators = resultsArray.filter(item => !(item.url || item.embed_url));
          
          // Si no hay texto y se filtró por categoría (distinta de "todas"), se llama adicionalmente a getVideosByCategory
          if (!this.text && this.categoria && this.categoria !== 'todas') {
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
                this.mapCreatorIdsToNames(this.videos).subscribe({
                  next: () => {
                    this.mapCreatorIdsToNames(this.creators).subscribe({
                      next: () => {
                        this.applyTypeFilter();
                        this.separateResults();
                        this.isLoading = false;
                      },
                      error: () => {
                        this.applyTypeFilter();
                        this.separateResults();
                        this.isLoading = false;
                      }
                    });
                  },
                  error: () => {
                    this.applyTypeFilter();
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
            this.mapCreatorIdsToNames(this.videos).subscribe({
              next: () => {
                this.mapCreatorIdsToNames(this.creators).subscribe({
                  next: () => {
                    this.applyTypeFilter();
                    this.separateResults();
                    this.isLoading = false;
                  },
                  error: () => {
                    this.applyTypeFilter();
                    this.separateResults();
                    this.isLoading = false;
                  }
                });
              },
              error: () => {
                this.applyTypeFilter();
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
  }
  
  private separateResults(): void {
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
          item.creator = item.creatorId && nameMap[item.creatorId] ? nameMap[item.creatorId] : 'Unknown';
        });
        return of(true);
      })
    );
  }
  
  // Si se ha seleccionado un tipo específico, descartamos el otro conjunto
  private applyTypeFilter(): void {
    if (this.selectedSearchType === 'videos') {
      this.creators = [];
    } else if (this.selectedSearchType === 'creadors') {
      this.videos = [];
    }
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
  
  applyFilters(): void {
    // Aquí se pueden aplicar filtros adicionales si es necesario.
  }
}
