import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { CreatorsService, Creator } from '../../services/creators.service';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SliderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Slider de canales en directo o fallback
  liveChannels: any[] = [];
  sliderTitle: string = 'Canals en Directe';
  isLoadingLive = true;

  // Slider de vídeos destacados (YouTube)
  featuredVideos: any[] = [];
  isLoadingFeatured = true;

  // Caché de todos los creadores para lookup en memoria
  private allCreators: Creator[] = [];

  constructor(private creatorsService: CreatorsService) {}

  ngOnInit(): void {
    // 1. Precargamos todos los creadores
    this.creatorsService.getAllCreators().subscribe({
      next: (creators) => {
        this.allCreators = creators;
        // 2. Solo entonces arrancamos los sliders
        this.loadTwitchSection();
        this.loadFeaturedYoutube();
      },
      error: (err) => {
        console.error('Error cargando todos los creadores:', err);
        // aunque fallen, aún lanzamos los sliders (sacarán "Unknown")
        this.loadTwitchSection();
        this.loadFeaturedYoutube();
      },
    });
  }

  // private loadTwitchSection(): void {
  //   this.isLoadingLive = true;
  //   this.creatorsService.getTwitchDirectes().subscribe({
  //     next: channels => {
  //       if (Array.isArray(channels) && channels.length) {
  //         this.sliderTitle = 'Canals en Directe';
  //         this.liveChannels = channels.map(ch => ({
  //           url: `https://www.twitch.tv/${ch.user_login}`,
  //           thumbnail: ch.thumbnail_url
  //             ?.replace('{width}', '320')
  //             ?.replace('{height}', '180'),
  //           title: ch.title,
  //           creatorId: ch.creatorId,
  //           isLive: true
  //         }));
  //         this.assignCreatorInfo(this.liveChannels);
  //       } else {
  //         this.fallbackToLastTwitchVideos();
  //       }
  //     },
  //     error: err => {
  //       console.error('Error al cargar directos de Twitch:', err);
  //       this.fallbackToLastTwitchVideos();
  //     }
  //   });
  // }

  private loadTwitchSection(): void {
    this.isLoadingLive = true;

    // 👉 EN LUGAR de llamarle al servicio, forzamos un array vacío
    of([]).subscribe({
      next: (channels) => {
        // Como channels.length === 0, entrará directamente en el fallback
        this.fallbackToLastTwitchVideos();
      },
      error: () => {
        this.fallbackToLastTwitchVideos();
      },
    });
  }

  private fallbackToLastTwitchVideos(): void {
    this.creatorsService.getLastTwitchVideos().subscribe({
      next: (videos) => {
        this.sliderTitle = 'Últims Twitch';
        this.liveChannels = Array.isArray(videos)
          ? videos.map((v) => ({
              url: v.url,
              thumbnail: v.thumbnail_url?.includes('%{width}')
                ? v.thumbnail_url
                    .replace(/%\{width\}/g, '320')
                    .replace(/%\{height\}/g, '180')
                : v.thumbnail_url,
              title: v.title,
              creatorId: v.creatorId,
              duration: v.duration,
            }))
          : [];
        this.assignCreatorInfo(this.liveChannels);
      },
      error: (err) => {
        console.error('Error en fallback getLastTwitchVideos:', err);
        this.liveChannels = [];
        this.sliderTitle = 'Últims Twitch';
        this.isLoadingLive = false;
      },
    });
  }

  private loadFeaturedYoutube(): void {
    this.isLoadingFeatured = true;
    this.creatorsService.getLastYoutubeVideos().subscribe({
      next: (videos) => {
        this.featuredVideos = Array.isArray(videos)
          ? videos.map((video) => ({
              url: `https://www.youtube.com/watch?v=${video.video_id}`,
              thumbnail: video.thumbnail_url,
              title: video.title,
              description: video.description || 'No description available',
              creatorId: video.creatorId,
              duration: video.duration,
            }))
          : [];
        this.assignCreatorInfo(this.featuredVideos, false);
      },
      error: (err) => {
        console.error('Error al cargar vídeos destacats:', err);
        this.featuredVideos = [];
        this.isLoadingFeatured = false;
      },
    });
  }

  /**
   * Mapea en memoria each item.creatorId -> {name,imageUrl} usando this.allCreators.
   * Si found, añade item.creator + item.creatorImage; si no, deja "Unknown" + default.
   */
  private assignCreatorInfo(items: any[], isLiveSection = true): void {
    const defaultImg = 'assets/img/default-creator-profile.png';
    // Preparo un mapa en memoria para lookup constante
    const lookup = this.allCreators.reduce((acc, c) => {
      acc[c.creatorId] = { name: c.name, imageUrl: c.imageUrl || defaultImg };
      return acc;
    }, {} as Record<string, { name: string; imageUrl: string }>);
    // Asigno a cada ítem
    items.forEach((item) => {
      const info = lookup[item.creatorId];
      item.creator = info?.name ?? 'Unknown';
      item.creatorImage = info?.imageUrl ?? defaultImg;
    });
    // Marco carga terminada
    if (isLiveSection) this.isLoadingLive = false;
    else this.isLoadingFeatured = false;
  }
}
