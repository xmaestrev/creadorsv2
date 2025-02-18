import { Component, OnInit } from '@angular/core';
import { CreatorsService } from '../../services/creators.service';
import { CommonModule } from '@angular/common';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SliderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  liveChannels: any[] = [];
  featuredVideos: any[] = [];
  isLoading = true;

  constructor(private creatorsService: CreatorsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Cargar canales en directo de Twitch
    this.creatorsService.getTwitchDirectes().subscribe({
      next: (channels) => {
        if (Array.isArray(channels)) {
          this.liveChannels = channels.map(channel => ({
            url: `https://www.twitch.tv/${channel.user_login}`,
            thumbnail: channel.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
            title: channel.title,
            creator: channel.user_name,
            isLive: true
          }));
        } else {
          console.warn('⚠️ Respuesta inesperada en getTwitchDirectes:', channels);
          this.liveChannels = [];
        }
      },
      error: (err) => console.error('❌ Error al cargar canales en directo:', err)
    });

    // Cargar videos destacados (Últimos en YouTube)
    this.creatorsService.getLastYoutubeVideos().subscribe({
      next: (videos) => {
        if (Array.isArray(videos)) {
          this.featuredVideos = videos.map(video => ({
            url: `https://www.youtube.com/watch?v=${video.video_id}`,
            thumbnail: video.thumbnail_url,
            title: video.title,
            description: video.description || 'No description available',
            creator: video.creatorName || 'Unknown',
            duration: video.duration
          }));
        } else {
          console.warn('⚠️ Respuesta inesperada en getLastYoutubeVideos:', videos);
          this.featuredVideos = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar videos destacados:', err);
        this.isLoading = false;
      }
    });
  }
}
