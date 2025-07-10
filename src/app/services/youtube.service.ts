// src/app/youtube.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';

const YOUTUBE_API_KEY = 'AIzaSyCiToKgB7XO6BboRAYo883uIqfCrLTCKK4';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  /** añadimos duración opcional */
  duration?: string;
  /** opcional: view count si lo quieres */
  viewCount?: string;
}

@Injectable({ providedIn: 'root' })
export class YoutubeService {
  constructor(private http: HttpClient) {}

getVideoDetailsById(id:string){
  const params=new HttpParams()
     .set('key',YOUTUBE_API_KEY)
     .set('id',id)
     .set('part','snippet,statistics,contentDetails');
  return this.http.get(`${YOUTUBE_API_URL}/videos`,{params});
}

  getRelatedVideos(
    videoID: string,
    maxResults: number = 8
  ): Observable<YoutubeVideo[]> {
    const params = new HttpParams()
      .set('key', YOUTUBE_API_KEY)
      .set('part', 'snippet')
      .set('relatedToVideoId', videoID)
      .set('type', 'video')
      .set('maxResults', maxResults.toString());
    return this.http.get<any>(`${YOUTUBE_API_URL}/search`, { params }).pipe(
      map((resp) =>
        (resp.items || []).map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails.medium.url,
          publishedAt: item.snippet.publishedAt,
          duration: '', // placeholder
          viewCount: '', // placeholder si lo vas a usar
        }))
      )
    );
  }

  getChannelIdByName(channelName: string): Observable<string> {
    const params = new HttpParams()
      .set('key', YOUTUBE_API_KEY)
      .set('part', 'snippet')
      .set('q', channelName)
      .set('type', 'channel');
    return this.http.get<any>(`${YOUTUBE_API_URL}/search`, { params }).pipe(
      switchMap((res) => {
        if (res.items?.length) return from([res.items[0].snippet.channelId]);
        throw new Error(`Channel not found: ${channelName}`);
      })
    );
  }

  getChannelVideosByName(
    channelName: string,
    maxResults: number = 4
  ): Observable<any> {
    return this.getChannelIdByName(channelName).pipe(
      switchMap((id) => {
        const params = new HttpParams()
          .set('key', YOUTUBE_API_KEY)
          .set('part', 'snippet')
          .set('channelId', id)
          .set('order', 'date')
          .set('maxResults', maxResults.toString());
        return this.http.get(`${YOUTUBE_API_URL}/search`, { params });
      })
    );
  }

getChannelDetailsById(channelId: string) {
  const params = new HttpParams()
    .set('key', YOUTUBE_API_KEY)
    .set('id', channelId)
    .set('part', 'snippet,statistics');

  return this.http.get<any>(`${YOUTUBE_API_URL}/channels`, { params });
}
}
