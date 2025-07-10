// src/app/youtube.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

/* ------------ Constantes ------------ */
const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_KEY  = 'AIzaSyCiToKgB7XO6BboRAYo883uIqfCrLTCKK4';

/* ------------ Modelos que realmente usamos ------------ */
export interface YoutubeVideo {
  videoId     : string;
  title       : string;
  description : string;
  thumbnail   : string;
  publishedAt : string;
  /* NUEVO → */
  tags?        : string[];
  viewCount?   : string;
  creator?     : string;   // nombre del canal (para sliders)
  creatorImage?: string;   // avatar del canal
  url?:string;
}

@Injectable({ providedIn: 'root' })
export class YoutubeService {

  constructor(private http: HttpClient) {}

  /* -------------------------------------------------------------------- *
   * 1) DETALLES DE UN VÍDEO (snippet + statistics + duration ISO-8601)   *
   * -------------------------------------------------------------------- */
  getVideoDetailsById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('id', id)
      .set('part', 'snippet,statistics,contentDetails');

    /* devolvemos la respuesta “raw” porque el componente la procesa */
    return this.http.get(`${YT_BASE}/videos`, { params });
  }

  /* -------------------------------------------------------------------- *
   * 2) RELACIONADOS: search?relatedToVideoId                              *
   * -------------------------------------------------------------------- */
  getRelatedVideos(videoId: string, max = 8): Observable<YoutubeVideo[]> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('part', 'snippet')
      .set('relatedToVideoId', videoId)
      .set('type', 'video')
      .set('maxResults', `${max}`);

    return this.http.get<any>(`${YT_BASE}/search`, { params }).pipe(
      map(r => (r.items || []).map((it: any) => ({
        videoId    : it.id.videoId,
        title      : it.snippet.title,
        description: it.snippet.description,
        thumbnail  : it.snippet.thumbnails.medium.url,
        publishedAt: it.snippet.publishedAt
      }))),
      catchError(() => of([]))
    );
  }

  /* -------------------------------------------------------------------- *
   * 3) “MORE FROM CHANNEL”  — por nombre, @handle o channelId            *
   * -------------------------------------------------------------------- */
  getChannelVideosByName(ref: string, max = 8): Observable<any> {
    return this.resolveChannelId(ref).pipe(
      mergeMap(id => id ? this.getChannelVideos(id, max) : of([])),
      catchError(() => of([]))
    );
  }

  /* -------------------------------------------------------------------- *
   * 4) VÍDEOS MÁS RECIENTES DE UN CANAL (id resuelto)                    *
   * -------------------------------------------------------------------- */
  private getChannelVideos(channelId: string, max = 8): Observable<YoutubeVideo[]> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('part', 'snippet')
      .set('channelId', channelId)
      .set('order', 'date')
      .set('maxResults', `${max}`);

    return this.http.get<any>(`${YT_BASE}/search`, { params }).pipe(
      map(r => (r.items || [])
        .filter((it: any) => it.id.kind === 'youtube#video')
        .map((it: any) => ({
          videoId    : it.id.videoId,
          title      : it.snippet.title,
          description: it.snippet.description,
          thumbnail  : it.snippet.thumbnails.medium.url,
          publishedAt: it.snippet.publishedAt
        }))),
      catchError(() => of([]))
    );
  }

  /* -------------------------------------------------------------------- *
   * 5) DETALLES DE UN CANAL (snippet + statistics)                       *
   * -------------------------------------------------------------------- */
  getChannelDetailsById(channelId: string): Observable<any> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('id', channelId)
      .set('part', 'snippet,statistics');

    return this.http.get<any>(`${YT_BASE}/channels`, { params });
  }

  /* -------------------------------------------------------------------- *
   * 6) RESOLVER REFERENCIA DE CANAL → ChannelId                          *
   * -------------------------------------------------------------------- */
  private resolveChannelId(ref: string): Observable<string | null> {

    /* a) ya es un channelId */
    if (ref.startsWith('UC') && ref.length === 24) return of(ref);

    /* b) es un @handle */
    if (ref.startsWith('@')) return this.getChannelIdByHandle(ref.substring(1));

    /* c) probamos username → fallback búsqueda genérica */
    return forkJoin([
      this.getChannelIdByUsername(ref),
      this.searchChannelId(ref)
    ]).pipe(
      map(([byUser, bySearch]) => byUser || bySearch || null),
      catchError(() => of(null))
    );
  }

  /* ---- helpers de resolución ---------------------------------------- */

  /** Nuevo parámetro `forHandle` (diciembre-2023) */
  private getChannelIdByHandle(handle: string): Observable<string | null> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('part', 'id')
      .set('forHandle', handle);

    return this.http.get<any>(`${YT_BASE}/channels`, { params }).pipe(
      map(r => r.items?.length ? r.items[0].id : null),
      catchError(() => of(null))
    );
  }

  private getChannelIdByUsername(username: string): Observable<string | null> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('part', 'id')
      .set('forUsername', username);

    return this.http.get<any>(`${YT_BASE}/channels`, { params }).pipe(
      map(r => r.items?.length ? r.items[0].id : null),
      catchError(() => of(null))
    );
  }

  private searchChannelId(query: string): Observable<string | null> {
    const params = new HttpParams()
      .set('key', YT_KEY)
      .set('part', 'id')
      .set('type', 'channel')
      .set('q', query)
      .set('maxResults', '1');

    return this.http.get<any>(`${YT_BASE}/search`, { params }).pipe(
      map(r => {
        if (!r.items?.length) return null;
        /* search → id.channelId */
        return (r.items[0].id as any).channelId || null;
      }),
      catchError(() => of(null))
    );
  }
}
