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

  private processCreatorContent(creatorData: Creator) {
    // default profile pic
    const profileImg = creatorData.imageUrl?.trim()
      ? creatorData.imageUrl
      : 'assets/img/default-creator-profile.png';

    this.twitchClips = [];
    this.twitchVideos = [];
    this.youtubeVideos = [];

    const channelsObj = (creatorData as any).linkedchannels || {};
    Object.values(channelsObj).forEach((channel: any) => {
      if (channel.type === 'twitch') {

        // Clips
        if (Array.isArray(channel.clips)) {
          channel.clips.forEach((clip: any) => {
            let thumb = clip.thumbnail_url;
            if (thumb?.includes('%{width}')) {
              thumb = thumb.replace(/%\{width\}/g,'320').replace(/%\{height\}/g,'180');
            }
            this.twitchClips.push({
              title: clip.title,
              url: clip.url,
              thumbnail: thumb,
              description: clip.creator_name || '',
              duration: clip.duration ? clip.duration + 's' : '',
              creator: creatorData.name,
              creatorId: creatorData.creatorId,
              creatorImage: profileImg
            });
          });
        }

        // Videos
        if (Array.isArray(channel.videos)) {
          channel.videos.forEach((vid: any) => {
            let thumb = vid.thumbnail_url;
            if (thumb?.includes('%{width}')) {
              thumb = thumb.replace(/%\{width\}/g,'320').replace(/%\{height\}/g,'180');
            }
            this.twitchVideos.push({
              title: vid.title,
              url: vid.url,
              thumbnail: thumb,
              description: vid.description || '',
              duration: vid.duration ? vid.duration + 's' : '',
              creator: creatorData.name,
              creatorId: creatorData.creatorId,
              creatorImage: profileImg
            });
          });
        }

      } else if (channel.type === 'youtube') {
        // YouTube videos
        if (Array.isArray(channel.videos)) {
          channel.videos.forEach((vid: any) => {
            this.youtubeVideos.push({
              title: vid.title,
              url: `https://www.youtube.com/watch?v=${vid.video_id}`,
              thumbnail: vid.thumbnail_url,
              description: vid.description || '',
              duration: vid.duration ? vid.duration + 's' : '',
              creator: creatorData.name,
              creatorId: creatorData.creatorId,
              creatorImage: profileImg
            });
          });
        }
      }
    });
  }

  goToContent(item: any): void {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  navigateToCreator(): void {
    this.router.navigate(['/creador'], { queryParams: { id: this.creator!.creatorId } });
  }

  viewAllContent(type: string): void {
    alert(`Funcionalidad "Ver todos" para ${type} pendiente de implementar...`);
  }
}
