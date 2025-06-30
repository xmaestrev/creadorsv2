// src/app/reproductor-youtube/reproductor-youtube.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { YoutubeService, YoutubeVideo } from '../youtube.service';
import { SafeUrlPipe } from '../pipes/safe-url.pipe';

@Component({
  selector: 'app-reproductor-youtube',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeUrlPipe],
  templateUrl: './reproductor-youtube.component.html',
  styleUrls: ['./reproductor-youtube.component.css']
})
export class ReproductorYoutubeComponent implements OnInit {
  videoId!: string;
  video?: YoutubeVideo;
  related: YoutubeVideo[] = [];
  descriptionCollapsed = true;

  // ← bandera para controlar el skeleton
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private yt: YoutubeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.videoId = params['videoID'];
      if (this.videoId) {
        this.loadVideo();
      }
    });
  }

  private loadVideo() {
    this.isLoading = true;

    // 1) Carga detalles del vídeo
    this.yt.getVideoDetailsById(this.videoId).subscribe({
      next: resp => {
        const item = resp.items[0];
        const sn = item.snippet;
        this.video = {
          videoId: this.videoId,
          title: sn.title,
          description: sn.description,
          thumbnail: sn.thumbnails.medium.url,
          publishedAt: sn.publishedAt
        };

        // 2) Una vez tenemos el vídeo, pedimos los relacionados
        this.yt.getRelatedVideos(this.videoId, 8).subscribe({
          next: list => {
            this.related = list;
            this.isLoading = false;
          },
          error: err => {
            console.error('Error al cargar relacionados:', err);
            this.related = [];
            this.isLoading = false;
          }
        });
      },
      error: err => {
        console.error('Error al cargar detalles del vídeo:', err);
        this.isLoading = false;
      }
    });
  }

  goTo(video: YoutubeVideo) {
    this.router.navigate([], { queryParams: { videoID: video.videoId } });
  }
}
