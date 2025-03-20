import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { CreatorsService } from '../../services/creators.service';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SliderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  // Slider de canales en directo o fallback
  liveChannels: any[] = [];
  sliderTitle: string = 'Canals en Directe';
  isLoadingLive: boolean = true;

  // Slider de vídeos destacados (YouTube)
  featuredVideos: any[] = [];
  isLoadingFeatured: boolean = true;

  constructor(private creatorsService: CreatorsService) {}

  ngOnInit(): void {
    this.loadTwitchSection();
    this.loadFeaturedYoutube();
  }

  private loadTwitchSection(): void {
    this.isLoadingLive = true;
    this.creatorsService.getTwitchDirectes().subscribe({
      next: (channels) => {
        if (Array.isArray(channels) && channels.length > 0) {
          this.sliderTitle = 'Canals en Directe';
          // Mapeamos los canales en directo
          this.liveChannels = channels.map(ch => ({
            url: `https://www.twitch.tv/${ch.user_login}`,
            thumbnail: ch.thumbnail_url?.replace('{width}', '320')?.replace('{height}', '180'),
            title: ch.title,
            creatorId: ch.creatorId, // se usa la ID interna
            isLive: true
          }));
          // Asignar nombre e imagen de perfil a cada item
          this.mapCreatorIdsToNames(this.liveChannels).subscribe({
            next: () => { this.isLoadingLive = false; },
            error: () => { this.isLoadingLive = false; }
          });
        } else {
          this.fallbackToLastTwitchVideos();
        }
      },
      error: (err) => {
        console.error('Error al cargar directos de Twitch:', err);
        this.fallbackToLastTwitchVideos();
      }
    });
  }

  private fallbackToLastTwitchVideos(): void {
    this.creatorsService.getLastTwitchVideos().subscribe({
      next: (videos) => {
        this.sliderTitle = 'Últims Twitch';
        if (Array.isArray(videos)) {
          this.liveChannels = videos.map(v => ({
            url: v.url,
            thumbnail: v.thumbnail_url && v.thumbnail_url.includes('%{width}')
              ? v.thumbnail_url.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180')
              : v.thumbnail_url,
            title: v.title,
            creatorId: v.creatorId,
            duration: v.duration
          }));
        } else {
          console.warn('No hay vídeos de fallback para Twitch.');
          this.liveChannels = [];
        }
        this.mapCreatorIdsToNames(this.liveChannels).subscribe({
          next: () => { this.isLoadingLive = false; },
          error: () => { this.isLoadingLive = false; }
        });
      },
      error: (err) => {
        console.error('Error en fallback getLastTwitchVideos:', err);
        this.liveChannels = [];
        this.sliderTitle = 'Últims Twitch';
        this.isLoadingLive = false;
      }
    });
  }

  private loadFeaturedYoutube(): void {
    this.isLoadingFeatured = true;
    this.creatorsService.getLastYoutubeVideos().subscribe({
      next: (videos) => {
        if (Array.isArray(videos)) {
          this.featuredVideos = videos.map(video => ({
            url: `https://www.youtube.com/watch?v=${video.video_id}`,
            thumbnail: video.thumbnail_url,
            title: video.title,
            description: video.description || 'No description available',
            creatorId: video.creatorId,
            duration: video.duration
          }));
        } else {
          console.warn('Respuesta inesperada en getLastYoutubeVideos:', videos);
          this.featuredVideos = [];
        }
        this.mapCreatorIdsToNames(this.featuredVideos).subscribe({
          next: () => { this.isLoadingFeatured = false; },
          error: () => { this.isLoadingFeatured = false; }
        });
      },
      error: (err) => {
        console.error('Error al cargar vídeos destacats:', err);
        this.featuredVideos = [];
        this.isLoadingFeatured = false;
      }
    });
  }

  /**
   * Llama a getCreatorById para cada creatorId único y asigna a cada item:
   * - item.creator => nombre real del creador
   * - item.creatorImage => URL de la imagen de perfil del creador
   */
  private mapCreatorIdsToNames(items: any[]): any {
    const distinctIds = Array.from(new Set(items.map(i => i.creatorId).filter(x => x)));
    if (distinctIds.length === 0) {
      return of(null);
    }
    const calls = distinctIds.map(id => this.creatorsService.getCreatorById(id));
    return forkJoin(calls).pipe(
      mergeMap((creatorsData: any[]) => {
        const infoMap: Record<string, { name: string, imageUrl: string }> = {};
        creatorsData.forEach(c => {
          if (c && c.creatorId) {
            infoMap[c.creatorId] = { name: c.name, imageUrl: c.imageUrl };
          }
        });
        items.forEach(item => {
          if (item.creatorId && infoMap[item.creatorId]) {
            item.creator = infoMap[item.creatorId].name;
            item.creatorImage = infoMap[item.creatorId].imageUrl;
          } else {
            item.creator = 'Unknown';
            item.creatorImage = 'assets/img/default-creator-profile.png';
          }
        });
        return of(true);
      })
    );
  }
}
