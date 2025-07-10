import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CreatorsService, Creator } from '../../services/creators.service';

@Component({
  selector: 'app-creator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.css']
})
export class CreatorComponent implements OnInit {
  creatorId!: string;
  creator: Creator | null = null;
  isLoading = true;

  twitchClips: any[] = [];
  twitchVideos: any[] = [];
  youtubeVideos: any[] = [];

  // Para la paginación “Ver más”
  first4 = 4;
  displayed = 8;

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
        console.error('Falta el queryParam id del creador');
      }
    });
  }

  private loadCreatorInfo(): void {
    this.isLoading = true;
    this.creatorsService.getCreatorById(this.creatorId).subscribe({
      next: data => {
        this.creator = data;
        this.processCreatorContent(data);
        this.isLoading = false;
      },
      error: err => {
        console.error('Error cargando creador:', err);
        this.isLoading = false;
      }
    });
  }

  private processCreatorContent(data: Creator) {
    const profileImg = data.imageUrl?.trim()
      ? data.imageUrl
      : 'assets/img/default-creator-profile.png';

    this.twitchClips   = [];
    this.twitchVideos  = [];
    this.youtubeVideos = [];

    const linked = (data as any).linkedchannels || {};
    Object.values(linked).forEach((ch: any) => {
      if (ch.type === 'twitch') {
        // Clips
        (ch.clips || []).forEach((c: any) => {
          let thumb = c.thumbnail_url;
          if (thumb?.includes('%{width}')) {
            thumb = thumb.replace(/%\{width\}/g,'320')
                         .replace(/%\{height\}/g,'180');
          }
          this.twitchClips.push({
            title: c.title,
            url:    c.url,
            thumbnail: thumb,
            creator:   data.name,
            creatorId:data.creatorId,
            creatorImage: profileImg
          });
        });
        // Videos
        (ch.videos || []).forEach((v: any) => {
          let thumb = v.thumbnail_url;
          if (thumb?.includes('%{width}')) {
            thumb = thumb.replace(/%\{width\}/g,'320')
                         .replace(/%\{height\}/g,'180');
          }
          this.twitchVideos.push({
            title: v.title,
            url:    v.url,
            thumbnail: thumb,
            creator:   data.name,
            creatorId:data.creatorId,
            creatorImage: profileImg
          });
        });
      }
      if (ch.type === 'youtube') {
        (ch.videos || []).forEach((v: any) => {
          this.youtubeVideos.push({
            title: v.title,
            url:    `https://www.youtube.com/watch?v=${v.video_id}`,
            thumbnail: v.thumbnail_url,
            creator:   data.name,
            creatorId:data.creatorId,
            creatorImage: profileImg
          });
        });
      }
    });
  }

  open(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  loadMore() {
    this.displayed += this.first4;
  }
}
