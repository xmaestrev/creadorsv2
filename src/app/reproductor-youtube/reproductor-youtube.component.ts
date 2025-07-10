import { Component, OnInit }   from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule }        from '@angular/common';
import { forkJoin, from, of }        from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { YoutubeService, YoutubeVideo } from '../services/youtube.service';
import { SafeUrlPipe }      from '../pipes/safe-url.pipe';
import { SliderComponent }  from '../components/slider/slider.component';

@Component({
  selector   : 'app-reproductor-youtube',
  standalone : true,
  imports    : [CommonModule, RouterModule, SafeUrlPipe, SliderComponent],
  templateUrl: './reproductor-youtube.component.html',
  styleUrls  : ['./reproductor-youtube.component.css'],
})
export class ReproductorYoutubeComponent implements OnInit {

  /* ───── estado ───── */
  videoId!: string;
  video?:  YoutubeVideo;

  related:         YoutubeVideo[] = [];
  moreFromChannel: YoutubeVideo[] = [];

  /* info canal */
  channelId        = '';
  channelName      = '';
  channelAvatarUrl = '/placeholder.svg?height=40&width=40';
  subscriberCount  = '';

  isLoading = true;

  constructor(
    private route : ActivatedRoute,
    private yt    : YoutubeService,
    private router: Router) {}

  /* ───── init ───── */
  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      const raw = decodeURIComponent(p['videoID'] || '').split('&')[0];
      if (raw && raw !== this.videoId) { this.videoId = raw; this.load(); }
    });
  }

  /* ───── carga principal ───── */
  private load(): void {
    this.isLoading = true;

    this.yt.getVideoDetailsById(this.videoId)      // snippet + statistics + duration
      .pipe(
        switchMap(resp => {
          const item: any = resp.items?.[0];
          if (!item) { console.error('Sin datos', resp); return of(null); }

          /* vídeo principal */
          const sn: any = item.snippet;
          const st: any = item.statistics ?? {};
          this.video = {
            videoId     : this.videoId,
            title       : sn.title,
            description : sn.description,
            thumbnail   : sn.thumbnails?.medium?.url,
            publishedAt : sn.publishedAt,
            tags        : sn.tags || [],
            viewCount   : st.viewCount || '0'
          };

          /* canal */
          this.channelId   = sn.channelId;
          this.channelName = sn.channelTitle;

          /* peticiones en paralelo */
          return forkJoin({
            related : this.yt.getRelatedVideos(this.videoId, 8)
                         .pipe(catchError(() => of([]))),
            more    : this.yt.getChannelVideosByName(this.channelName, 8)
                         .pipe(catchError(() => of([]))),
            channel : this.yt.getChannelDetailsById(this.channelId)
                         .pipe(catchError(() => of({ items: [] })))
          });
        })
      )
      .subscribe(bundle => {
        if (!bundle) { this.isLoading = false; return; }

        /* avatar + subs */
        const ch: any = (bundle.channel as any).items?.[0];
        if (ch) {
          this.channelAvatarUrl = ch.snippet.thumbnails.default.url;
          const subs = +ch.statistics?.subscriberCount || 0;
          this.subscriberCount  = subs ? subs.toLocaleString('en-US') + ' subscribers' : '';
        }

        /* inject creator info en cada vídeo para que <app-slider> los pinte */
        const mapCreator = (v: YoutubeVideo): YoutubeVideo => ({
          ...v,
          creator      : this.channelName,
          creatorImage : this.channelAvatarUrl
        });

        this.related         = (bundle.related as YoutubeVideo[]).map(mapCreator);
        this.moreFromChannel = (bundle.more    as YoutubeVideo[]).map(mapCreator);

        this.isLoading = false;
      });
  }

  /* ───── helpers ───── */
  goTo(v: YoutubeVideo): void {
    this.router.navigate([], { queryParams: { videoID: v.videoId } });
  }
}
