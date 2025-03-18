import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorsService, Creator } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
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

  // Arrays para cada slider
  twitchClips: any[] = [];
  twitchVideos: any[] = [];
  youtubeVideos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private creatorsService: CreatorsService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
        this.processCreatorContent(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar creador:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Procesa los contenidos de "linked_channels" y separa en:
   * - twitchClips: clips de Twitch
   * - twitchVideos: vídeos de Twitch
   * - youtubeVideos: vídeos de YouTube (si existiesen)
   */
  processCreatorContent(creatorData: Creator) {
    // Inicializamos los arrays
    this.twitchClips = [];
    this.twitchVideos = [];
    this.youtubeVideos = [];

    // linked_channels puede ser un objeto; iteramos sobre sus keys.
    const channelsObj = (creatorData as any).linkedchannels || {};
    Object.keys(channelsObj).forEach(key => {
      const channel = channelsObj[key];
      if (channel.type === 'twitch') {
        // Procesamos clips
        if (channel.clips && Array.isArray(channel.clips)) {
          const mappedClips = channel.clips.map((clip: any) => {
            let fixedThumbnail = clip.thumbnail_url;
            if (fixedThumbnail && fixedThumbnail.includes('%{width}')) {
              fixedThumbnail = fixedThumbnail.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180');
            }
            return {
              title: clip.title,
              url: clip.url,
              thumbnail: fixedThumbnail,
              description: clip.creator_name || '',
              duration: clip.duration ? clip.duration + 's' : '',
              creator: this.creator ? this.creator.name : 'Unknown',
              creatorId: this.creator ? this.creator.creatorId : ''
            };
          });
          this.twitchClips.push(...mappedClips);
        }
        // Procesamos vídeos (si existen)
        if (channel.videos && Array.isArray(channel.videos)) {
          const mappedVideos = channel.videos.map((vid: any) => {
            let fixedThumbnail = vid.thumbnail_url;
            if (fixedThumbnail && fixedThumbnail.includes('%{width}')) {
              fixedThumbnail = fixedThumbnail.replace(/%\{width\}/g, '320').replace(/%\{height\}/g, '180');
            }
            return {
              title: vid.title,
              url: vid.url,
              thumbnail: fixedThumbnail,
              description: vid.description || '',
              duration: vid.duration ? vid.duration + 's' : '',
              creator: this.creator ? this.creator.name : 'Unknown',
              creatorId: this.creator ? this.creator.creatorId : ''
            };
          });
          this.twitchVideos.push(...mappedVideos);
        }
      } else if (channel.type === 'youtube') {
        // Procesamos vídeos de YouTube (si se implementa)
        if (channel.videos && Array.isArray(channel.videos)) {
          const mappedYT = channel.videos.map((vid: any) => ({
            title: vid.title,
            url: `https://www.youtube.com/watch?v=${vid.video_id}`,
            thumbnail: vid.thumbnail_url,
            description: vid.description || '',
            duration: vid.duration ? vid.duration + 's' : '',
            creator: this.creator ? this.creator.name : 'Unknown',
            creatorId: this.creator ? this.creator.creatorId : ''
          }));
          this.youtubeVideos.push(...mappedYT);
        }
      }
    });
  }

  /**
   * Abre el contenido (clip o vídeo) en nueva pestaña.
   */
  goToContent(item: any): void {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('El contenido no tiene URL');
    }
  }

  /**
   * Navega a la página del creador.
   */
  navigateToCreator(): void {
    if (this.creator && this.creator.creatorId) {
      this.router.navigate(['/creador'], { queryParams: { id: this.creator.creatorId } });
    }
  }

  /**
   * Funcionalidad pendiente para "Ver todos" de cada slider.
   */
  viewAllContent(type: string): void {
    alert(`Funcionalidad "Ver todos" para ${type} pendiente de implementar...`);
  }
}
