import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

const YOUTUBE_API_KEY = 'AIzaSyCiToKgB7XO6BboRAYo883uIqfCrLTCKK4';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el canal ID a partir del nombre del canal.
   */
  getChannelIdByName(channelName: string): Observable<string> {
    const params = new HttpParams()
      .set('key', YOUTUBE_API_KEY)
      .set('part', 'snippet')
      .set('q', channelName)
      .set('type', 'channel');

    return this.http.get<any>(`${YOUTUBE_API_URL}/search`, { params }).pipe(
      switchMap(response => {
        if (response.items && response.items.length > 0) {
          return from([response.items[0].snippet.channelId]);
        } else {
          throw new Error(`No se encontró el canal con el nombre "${channelName}"`);
        }
      })
    );
  }

  /**
   * Obtiene los videos de un canal mediante el nombre (máximo 10 por defecto).
   */
  getChannelVideosByName(channelName: string, maxResults: number = 10): Observable<any> {
    return this.getChannelIdByName(channelName).pipe(
      switchMap(channelId => this.getChannelVideos(channelId, maxResults))
    );
  }

  /**
   * Obtiene los videos de un canal utilizando el canal ID.
   */
  getChannelVideos(channelId: string, maxResults: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('key', YOUTUBE_API_KEY)
      .set('channelId', channelId)
      .set('part', 'snippet')
      .set('order', 'date')
      .set('maxResults', maxResults.toString());

    return this.http.get(`${YOUTUBE_API_URL}/search`, { params });
  }

  /**
   * Obtiene los detalles de un video específico mediante su ID.
   */
  getVideoDetailsById(videoID: string): Observable<any> {
    const url = `${YOUTUBE_API_URL}/videos?part=snippet&id=${videoID}&key=${YOUTUBE_API_KEY}`;
    return this.http.get<any>(url);
  }
}
