import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { YoutubeService } from '../youtube.service';
import { SafeUrlPipe } from '../pipes/safe-url.pipe';
import { SliderComponent } from '../components/slider/slider.component';

/* ---------- Tipos ---------- */
export interface YoutubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  tags?: string[];
  viewCount?: number; // ← numérico
}

@Component({
  selector: 'app-reproductor-youtube',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeUrlPipe, SliderComponent],
  templateUrl: './reproductor-youtube.component.html',
  styleUrls: ['./reproductor-youtube.component.css'],
})
export class ReproductorYoutubeComponent implements OnInit {
  videoId!: string;
  video?: YoutubeVideo;

  related: YoutubeVideo[] = [];
  moreFromChannel: YoutubeVideo[] = [];

  /* Info canal */
  channelId = '';
  channelName = '';
  channelAvatarUrl = '/placeholder.svg?height=40&width=40';
  subscriberCount = '';

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private yt: YoutubeService,
    private router: Router
  ) {}

  /* ---------- Init ---------- */
  ngOnInit(): void {
    this.route.queryParams.subscribe((q) => {
      const id = decodeURIComponent(q['videoID'] || '').split('&')[0];
      if (id && id !== this.videoId) {
        this.videoId = id;
        this.load();
      }
    });
  }

  /* ----------- Carga ----------- */
  private load(): void {
    this.isLoading = true;

    this.yt
      .getVideoDetailsById(this.videoId)
      .pipe(
        switchMap((resp) => {
          const item: any = resp.items?.[0];
          if (!item) {
            console.error('Sin datos', resp);
            return of(null);
          }

          /* vídeo */
          const sn: any = item.snippet;
          const st: any = item.statistics ?? {};
          this.video = {
            videoId: this.videoId,
            title: sn.title,
            description: sn.description,
            thumbnail: sn.thumbnails?.medium?.url,
            publishedAt: sn.publishedAt,
            tags: sn.tags || [],
            viewCount: +st.viewCount || 0,
          };

          /* canal */
          this.channelId = sn.channelId;
          this.channelName = sn.channelTitle;

          /* 👇 ¡ojo al paréntesis! */
          return forkJoin({
            related: this.yt
              .getRelatedVideos(this.videoId, 8)
              .pipe(catchError(() => of([]))),

            more: this.yt
              .getChannelVideosByName(this.channelName, 4)
              .pipe(catchError(() => of({ items: [] }))),

            channel: this.yt
              .getChannelDetailsById(this.channelId)
              .pipe(catchError(() => of({ items: [] }))),
          });
        })
      )
      .subscribe((bundle) => {
        if (!bundle) {
          this.isLoading = false;
          return;
        }

        this.related = bundle.related;

        const items: any[] = (bundle.more as any).items || [];
        this.moreFromChannel = items.map((v) => ({
          videoId: v.id.videoId,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnail: v.snippet.thumbnails.medium.url,
          publishedAt: v.snippet.publishedAt,
        }));

        const ch: any = (bundle.channel as any).items?.[0];
        if (ch) {
          const thumbs = ch.snippet.thumbnails;
          this.channelAvatarUrl =
            thumbs?.high?.url || thumbs?.default?.url || this.channelAvatarUrl;
          this.subscriberCount = ch.statistics?.subscriberCount
            ? this.format(+ch.statistics.subscriberCount) + ' subscribers'
            : '';
        }
        this.isLoading = false;
      });
  }

  /* ----------- helpers ----------- */
  goTo(v: YoutubeVideo) {
    this.router.navigate([], { queryParams: { videoID: v.videoId } });
  }
  private format(n: number) {
    return n.toLocaleString('en-US');
  }
}
