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

  // Primer slider: directos de Twitch o fallback
  liveChannels: any[] = [];
  sliderTitle: string = 'Canals en Directe';
  isLoadingLive: boolean = true;

  // Segundo slider: videos destacados (YouTube)
  featuredVideos: any[] = [];
  isLoadingFeatured: boolean = true;

  constructor(private creatorsService: CreatorsService) {}

  ngOnInit(): void {
    this.loadTwitchSection();
    this.loadFeaturedYoutube();
  }

  /**
   * Carga la sección de Twitch:
   * 1) getTwitchDirectes -> si hay resultados, se usan
   * 2) si no hay, fallback a getLastTwitchVideos
   * 3) mapear creatorId -> nombre real de creador (getCreatorById)
   */
  private loadTwitchSection(): void {
    this.isLoadingLive = true;

    this.creatorsService.getTwitchDirectes().subscribe({
      next: (channels) => {
        if (Array.isArray(channels) && channels.length > 0) {
          // tenemos canales en directo
          this.sliderTitle = 'Canals en Directe';

          // Ajustar la data
          this.liveChannels = channels.map(ch => ({
            url: `https://www.twitch.tv/${ch.user_login}`,
            thumbnail: ch.thumbnail_url
                        ?.replace('{width}', '320')
                        ?.replace('{height}', '180'),
            title: ch.title,
            creatorId: ch.creatorId, // guardamos la ID interna
            isLive: true
          }));

          // Mapeamos a nombres
          this.mapCreatorIdsToNames(this.liveChannels).subscribe({
            next: () => {
              this.isLoadingLive = false;
              console.log('Canales en directo:', this.liveChannels);
            },
            error: () => {
              this.isLoadingLive = false;
            }
          });
        } else {
          // fallback a getLastTwitchVideos
          this.fallbackToLastTwitchVideos();
        }
      },
      error: (err) => {
        console.error('Error al cargar directos de Twitch:', err);
        // fallback
        this.fallbackToLastTwitchVideos();
      }
    });
  }

  /**
   * Llamado cuando no hay directos en Twitch o hay un error al obtenerlos.
   * Carga los últimos videos de Twitch y luego hace el map de ID->nombre.
   */
  private fallbackToLastTwitchVideos(): void {
    this.creatorsService.getLastTwitchVideos().subscribe({
      next: (videos) => {
        this.sliderTitle = 'Últims Twitch';
        if (Array.isArray(videos)) {
          // Ajustar la data
          this.liveChannels = videos.map(v => ({
            url: v.url,
            thumbnail: v.thumbnail_url?.includes('%{width}')
              ? v.thumbnail_url
                  .replace(/%\{width\}/g, '320')
                  .replace(/%\{height\}/g, '180')
              : v.thumbnail_url,
            title: v.title,
            creatorId: v.creatorId,  // en principio la ID interna
            duration: v.duration
          }));
        } else {
          console.warn('No hay vídeos de fallback para Twitch.');
          this.liveChannels = [];
        }
        // Mapear IDs a nombres
        this.mapCreatorIdsToNames(this.liveChannels).subscribe({
          next: () => {
            this.isLoadingLive = false;
          },
          error: () => {
            this.isLoadingLive = false;
          }
        });
        console.log('Fallback getLastTwitchVideos:', this.liveChannels);
      },
      error: (err) => {
        console.error('Error en fallback getLastTwitchVideos:', err);
        this.liveChannels = [];
        this.sliderTitle = 'Últims Twitch';
        this.isLoadingLive = false;
      }
    });
  }

  /**
   * Carga los vídeos destacados de YouTube y rellena creatorId -> nombre real
   */
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
            creatorId: video.creatorId, // ID interno
            duration: video.duration
          }));
        } else {
          console.warn('Respuesta inesperada en getLastYoutubeVideos:', videos);
          this.featuredVideos = [];
        }
        // mapear IDs a nombres
        this.mapCreatorIdsToNames(this.featuredVideos).subscribe({
          next: () => {
            this.isLoadingFeatured = false;
          },
          error: () => {
            this.isLoadingFeatured = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar vídeos destacados:', err);
        this.featuredVideos = [];
        this.isLoadingFeatured = false;
      }
    });
  }

  /**
   * Recibe un array de items que tienen creatorId
   * Llama a getCreatorById de forma paralela para cada ID único
   * Asigna item.creator = name real
   */
  private mapCreatorIdsToNames(items: any[]): any {
    // obtener IDs distintos
    const distinctIds = Array.from(new Set(items.map(i => i.creatorId).filter(x => x)));
    if (distinctIds.length === 0) {
      // no hay IDs que mapear
      return of(null);
    }
    // hacemos las llamadas en paralelo
    const calls = distinctIds.map(id => this.creatorsService.getCreatorById(id));
    return forkJoin(calls).pipe(
      mergeMap((creatorsData: any[]) => {
        // Creamos diccionario id -> name
        const nameMap: Record<string, string> = {};
        creatorsData.forEach(c => {
          if (c && c.creatorId) {
            nameMap[c.creatorId] = c.name;
          }
        });
        // asignar
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
}
