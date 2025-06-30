import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { CreatorsService, Creator } from '../../services/creators.service';
import { YoutubeService, YoutubeVideo } from '../../youtube.service';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SliderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // ⭐️ Destacats / ⌛ Últims Twitch
  featuredTwitch: any[] = [];
  isLoadingFeaturedTwitch = true;
  latestTwitch: any[] = [];
  isLoadingLatestTwitch = true;

  // ⭐️ Destacats / ⌛ Últims YouTube
  featuredYoutube: any[] = [];
  isLoadingFeaturedYoutube = true;
  latestYoutube: any[] = [];
  isLoadingLatestYoutube = true;

  // cache de creadores para lookup
  private allCreators: Creator[] = [];

  constructor(private creatorsService: CreatorsService) {}

  ngOnInit(): void {
    // 1) precargar todos los creadores
    this.creatorsService.getAllCreators().subscribe({
      next: (list) => {
        this.allCreators = list;
        this.loadFeaturedTwitch();
        this.loadLatestTwitch();
        this.loadFeaturedYoutube();
        this.loadLatestYoutube();
      },
      error: () => {
        // si falla, seguimos con empty lookup
        this.loadFeaturedTwitch();
        this.loadLatestTwitch();
        this.loadFeaturedYoutube();
        this.loadLatestYoutube();
      },
    });
  }

  private loadFeaturedTwitch() {
    this.isLoadingFeaturedTwitch = true;
    this.creatorsService.getDestacatsTwitch().subscribe({
      next: (vids) => {
        this.featuredTwitch = vids.map((v) => this.normalize(v));
        this.assignCreatorInfo(this.featuredTwitch, true);
      },
      error: () => {
        this.featuredTwitch = [];
        this.isLoadingFeaturedTwitch = false;
      },
    });
  }

  private loadLatestTwitch() {
    this.isLoadingLatestTwitch = true;
    this.creatorsService.getLastTwitchVideos().subscribe({
      next: (vids) => {
        this.latestTwitch = vids.map((v) => {
          const item = this.normalize(v);
          // quitamos duration para que *ngIf no lo renderice
          delete (item as any).duration;
          return item;
        });
        this.assignCreatorInfo(this.latestTwitch, true);
      },
      error: () => {
        this.latestTwitch = [];
        this.isLoadingLatestTwitch = false;
      },
    });
  }

  private loadFeaturedYoutube() {
    this.isLoadingFeaturedYoutube = true;
    this.creatorsService.getDestacatsYoutube().subscribe({
      next: (vids) => {
        this.featuredYoutube = vids.map((v) => this.normalize(v));
        this.assignCreatorInfo(this.featuredYoutube, false);
      },
      error: () => {
        this.featuredYoutube = [];
        this.isLoadingFeaturedYoutube = false;
      },
    });
  }

  private loadLatestYoutube() {
    this.isLoadingLatestYoutube = true;
    this.creatorsService.getLastYoutubeVideos().subscribe({
      next: (vids) => {
        this.latestYoutube = vids.map((v) => this.normalize(v));
        this.assignCreatorInfo(this.latestYoutube, false);
      },
      error: () => {
        this.latestYoutube = [];
        this.isLoadingLatestYoutube = false;
      },
    });
  }

  /** homogeneiza cualquier video proveniente del API */
  private normalize(v: any) {
    const creatorId = v.creatorId ?? '1';
    let thumb = v.thumbnail_url;
    if (thumb?.includes('%{width}')) {
      thumb = thumb
        .replace(/%\{width\}/g, '320')
        .replace(/%\{height\}/g, '180');
    }
    return {
      url: v.url,
      thumbnail: thumb,
      title: v.title,
      creatorId,
      duration: v.duration ? `${v.duration}s` : '',
      isLive: false,
      description: v.description || '',
      categories: [] as string[],
    };
  }

  /** asigna nombre e imagen de perfil según creatorId */
  private assignCreatorInfo(items: any[], isTwitchSection: boolean) {
    const defaultImg = 'assets/img/default-creator-profile.png';
    const lookup = this.allCreators.reduce((acc, c) => {
      acc[c.creatorId] = { name: c.name, imageUrl: c.imageUrl || defaultImg };
      return acc;
    }, {} as Record<string, { name: string; imageUrl: string }>);

    items.forEach((it) => {
      const info = lookup[it.creatorId];
      it.creator = info?.name ?? 'Unknown';
      it.creatorImage = info?.imageUrl ?? defaultImg;
    });

    // cerrar loaders en función de sección
    if (isTwitchSection) {
      this.isLoadingFeaturedTwitch = false;
      this.isLoadingLatestTwitch = false;
    } else {
      this.isLoadingFeaturedYoutube = false;
      this.isLoadingLatestYoutube = false;
    }
  }
}
