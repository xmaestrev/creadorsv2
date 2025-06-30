import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

interface VideoDetailResponse {
  items: Array<{
    snippet: {
      channelId: string;
      title: string;
      description: string;
      thumbnails: { medium: { url: string } };
      publishedAt: string;
    };
  }>;
}

interface ChannelSearchResponse {
  items: Array<{
    id: { videoId: string; kind: string };
    snippet: {
      title: string;
      description: string;
      thumbnails: { medium: { url: string } };
      publishedAt: string;
    };
  }>;
}

interface ChannelIdResponse {
  items: Array<{ id: string }>;
}

@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private apiKey = 'AIzaSyCiToKgB7XO6BboRAYo883uIqfCrLTCKK4';

  constructor(private http: HttpClient) {}

  /** Detalles de un vídeo por ID */
  getVideoDetailsById(videoId: string): Observable<VideoDetailResponse> {
    const params = new HttpParams()
      .set('part', 'snippet')
      .set('id', videoId)
      .set('key', this.apiKey);
    return this.http.get<VideoDetailResponse>(`${this.baseUrl}/videos`, { params });
  }

  /** Vídeos relacionados: obtiene los últimos vídeos del mismo canal */
  getRelatedVideos(videoId: string, maxResults = 8): Observable<YoutubeVideo[]> {
    return this.getVideoDetailsById(videoId).pipe(
      mergeMap(detailResp => {
        const channelId = detailResp.items[0]?.snippet.channelId;
        if (!channelId) return of([]);
        return this.getChannelVideos(channelId, maxResults);
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Trae los últimos vídeos de un canal.
   * Permite pasar: channelId, username o @handle.
   *   - Si empieza por "UC" lo tratamos como channelId.
   *   - Si empieza por "@" intentamos resolverlo con /channels?handle.
   *   - Si no, probamos con forUsername y, si falla, hacemos una búsqueda type=channel.
   */
  getChannelVideosByName(channelRef: string, maxResults = 8): Observable<YoutubeVideo[]> {
    return this.resolveChannelId(channelRef).pipe(
      mergeMap(id => (id ? this.getChannelVideos(id, maxResults) : of([]))),
      catchError(() => of([]))
    );
  }

  /* -------------------------------------------------- */
  /* Helpers                                             */
  /* -------------------------------------------------- */

  private getChannelVideos(channelId: string, maxResults = 8): Observable<YoutubeVideo[]> {
    const params = new HttpParams()
      .set('part', 'snippet')
      .set('channelId', channelId)
      .set('order', 'date')
      .set('maxResults', `${maxResults}`)
      .set('key', this.apiKey);

    return this.http
      .get<ChannelSearchResponse>(`${this.baseUrl}/search`, { params })
      .pipe(
        map(resp =>
          resp.items
            .filter(item => item.id.kind === 'youtube#video')
            .map(item => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.medium.url,
              publishedAt: item.snippet.publishedAt,
            }))
        ),
        catchError(() => of([]))
      );
  }

  /** Resuelve cualquier referencia de canal a su channelId */
  private resolveChannelId(ref: string): Observable<string | null> {
    // 1) Si ya parece un channelId, devolvemos tal cual
    if (ref.startsWith('UC') && ref.length === 24) {
      return of(ref);
    }

    // 2) Si es un @handle usamos el nuevo parámetro forHandle (dic‑2023)
    if (ref.startsWith('@')) {
      return this.getChannelIdByHandle(ref.substring(1));
    }

    // 3) Probamos con forUsername y, si no, con una búsqueda type=channel
    return forkJoin([
      this.getChannelIdByUsername(ref),
      this.searchChannelId(ref),
    ]).pipe(
      map(([byUser, bySearch]) => byUser || bySearch || null)
    );
  }

  private getChannelIdByHandle(handle: string): Observable<string | null> {
    const params = new HttpParams()
      .set('part', 'id')
      .set('forHandle', handle) // ✨ nuevo parámetro beta
      .set('key', this.apiKey);

    return this.http
      .get<ChannelIdResponse>(`${this.baseUrl}/channels`, { params })
      .pipe(
        map(resp => (resp.items?.length ? resp.items[0].id : null)),
        catchError(() => of(null))
      );
  }

  private getChannelIdByUsername(username: string): Observable<string | null> {
    const params = new HttpParams()
      .set('part', 'id')
      .set('forUsername', username)
      .set('key', this.apiKey);

    return this.http
      .get<ChannelIdResponse>(`${this.baseUrl}/channels`, { params })
      .pipe(
        map(resp => (resp.items?.length ? resp.items[0].id : null)),
        catchError(() => of(null))
      );
  }

  private searchChannelId(query: string): Observable<string | null> {
    const params = new HttpParams()
      .set('part', 'id')
      .set('type', 'channel')
      .set('q', query)
      .set('maxResults', '1')
      .set('key', this.apiKey);

    return this.http
      .get<ChannelSearchResponse>(`${this.baseUrl}/search`, { params })
      .pipe(
        map(resp => (resp.items?.length ? (resp.items[0].id as any).channelId : null)),
        catchError(() => of(null))
      );
  }
}
