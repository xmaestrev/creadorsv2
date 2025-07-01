// src/app/reproductor-youtube/reproductor-youtube.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { YoutubeService } from '../youtube.service';
import { SafeUrlPipe } from '../pipes/safe-url.pipe';
import { SliderComponent } from '../components/slider/slider.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface YoutubeVideo {
  videoId:     string;
  title:       string;
  description: string;
  thumbnail:   string;
  publishedAt: string;
  tags?:       string[];
}

@Component({
  selector: 'app-reproductor-youtube',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SafeUrlPipe,
    SliderComponent   // ¡importamos tu slider personalizado!
  ],
  templateUrl: './reproductor-youtube.component.html',
  styleUrls: ['./reproductor-youtube.component.css'],
})
export class ReproductorYoutubeComponent implements OnInit {
  videoId!: string;
  video?: YoutubeVideo;
  related: YoutubeVideo[]      = [];
  moreFromChannel: YoutubeVideo[] = [];
  videoTags: string[]          = [];
  isLoading = true;

  // Canal
  channelName      = '';
  channelAvatarUrl = '/placeholder.svg?height=40&width=40';
  subscriberCount  = '';

  constructor(
    private route: ActivatedRoute,
    private yt: YoutubeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      let vid = (params['videoID'] as string || '').split('&')[0];
      vid = decodeURIComponent(vid);
      if (!vid) return console.error('Falta videoID');
      if (vid !== this.videoId) {
        this.videoId = vid;
        this.loadVideo();
      }
    });
  }

  private loadVideo(): void {
    this.isLoading = true;

    // 1) Detalles del vídeo
    this.yt.getVideoDetailsById(this.videoId).subscribe({
      next: resp => {
        const item: any = resp.items?.[0];
        if (!item) {
          console.error('No hay datos de vídeo', resp);
          this.isLoading = false;
          return;
        }
        const sn: any = item.snippet;

        this.video = {
          videoId:     this.videoId,
          title:       sn.title || 'Untitled',
          description: sn.description || '',
          thumbnail:   sn.thumbnails?.medium?.url || '',
          publishedAt: sn.publishedAt || '',
          tags:        Array.isArray(sn.tags) ? sn.tags : []
        };
        this.videoTags = this.video.tags!;

        // Canal
        this.channelName     = sn.channelTitle || this.channelName;
        this.subscriberCount = '1 234 567 subscribers'; // placeholder

        // 2) y 3) Relacionados + More from channel
        forkJoin({
          related: this.yt.getRelatedVideos(this.videoId, 8)
            .pipe(catchError(_ => of([] as YoutubeVideo[]))),
          more:    this.yt.getChannelVideosByName(this.channelName, 4)
            .pipe(catchError(_ => of({ items: [] } as any)))
        }).subscribe(({ related, more }) => {
          this.related = related;
          const items: any[] = (more as any).items || [];
          this.moreFromChannel = items.map(v => ({
            videoId:     v.id.videoId,
            title:       v.snippet.title,
            description: v.snippet.description || '',
            thumbnail:   v.snippet.thumbnails.medium.url,
            publishedAt: v.snippet.publishedAt
          }));
          this.isLoading = false;
        });
      },
      error: err => {
        console.error('Error cargando detalles:', err);
        this.isLoading = false;
      }
    });
  }

  goTo(video: YoutubeVideo): void {
    this.router.navigate([], {
      queryParams: { videoID: video.videoId, ab_channel: this.channelName }
    });
  }
}
