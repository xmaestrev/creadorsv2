import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CreatorsService, Creator } from '../../services/creators.service';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
  selector: 'app-creator',
  standalone: true,
  imports: [CommonModule, SliderComponent],
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.css']
})
export class CreatorComponent implements OnInit {

  creatorId!: string;
  creator: Creator | null = null;
  isLoading = true;

  // Array donde guardamos un subset (hasta 4) de videos/clips
  firstVideos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private creatorsService: CreatorsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtenemos ?id=xxx de los query params
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.creatorId = id;
        this.loadCreatorInfo();
      } else {
        console.error('No se recibió el ID del creador por query param');
      }
    });
  }

  loadCreatorInfo(): void {
    this.isLoading = true;
    this.creatorsService.getCreatorById(this.creatorId).subscribe({
      next: (data) => {
        console.log('Creador cargado:', data);
        this.creator = data;
        this.processCreatorVideos(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar creador:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Recorre 'linkedchannels' y extrae clips o videos de Twitch/YouTube
   */
  processCreatorVideos(creatorData: Creator) {
    const allVideos: any[] = [];

    // 'linkedchannels' es un objeto cuyas keys son p.ej. 'twitch419181553', 'youtubeUCVBivcw5ZUV1tHqF7Xm0ZdA'
    // Recorremos cada key:
    const channelsObj = (creatorData as any).linkedchannels || {};

    for (const channelKey of Object.keys(channelsObj)) {
      const channel = channelsObj[channelKey];
      // Si es de tipo 'twitch' y tiene 'clips'
      if (channel.type === 'twitch') {
        if (channel.clips && Array.isArray(channel.clips)) {
          // Mapear cada clip a una estructura uniforme
          const mappedClips = channel.clips.map((clip: any) => ({
            title: clip.title,
            url: clip.url,
            thumbnail: clip.thumbnail_url,
            description: clip.creator_name || '', // o clip.description si existiera
            duration: clip.duration ? clip.duration + 's' : '',
          }));
          allVideos.push(...mappedClips);
        }
        // Si en el futuro hay channel.videos, también podríamos mapearlos
        if (channel.videos && Array.isArray(channel.videos)) {
          const mappedVideos = channel.videos.map((vid: any) => ({
            title: vid.title,
            url: vid.url,
            thumbnail: vid.thumbnail_url,
            description: vid.description || '',
            duration: vid.duration ? vid.duration + 's' : '',
          }));
          allVideos.push(...mappedVideos);
        }
      }
      // Si es de tipo 'youtube' y en el futuro tuviera 'videos', lo procesaríamos igual
      if (channel.type === 'youtube') {
        // Por ahora, no hay array de videos. Si en el futuro se implementa, se haría algo parecido:
        // if (channel.videos && Array.isArray(channel.videos)) { ... }
      }
    }

    // Guardar solo los primeros 4 en 'firstVideos'
    this.firstVideos = allVideos.slice(0, 4);
  }

  /**
   * Abre el video/clip en una nueva pestaña (por ahora).
   */
  goToVideo(video: any): void {
    if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('El video no tiene URL');
    }
  }

  /**
   * Placeholder para "Ver todos"
   */
  viewAllVideos(): void {
    alert('Funcionalidad "Ver todos" pendiente de implementar...');
  }
}
