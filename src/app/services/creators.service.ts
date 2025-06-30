import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// Ejemplo de interfaz mínima para Creator
// Puedes crear archivos/interfaces más detalladas si deseas
export interface Creator {
  creatorId: string;
  name: string;
  description: string;
  imageUrl: string;
  linked_channels: Array<{
    type: string;
    channelId: string;
    url: string;
    user: string;
    description: string;
    clips?: any[];
    videos?: any[];
  }>;
}

// Ejemplo de interfaz mínima para Video
export interface Video {
  video_id: string;
  creatorId?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
  url?: string;
  thumbnail_url?: string; // <-- Agregar esta propiedad
  duration?: string;
  creatorName?: string;
  autor?: string;
  view_count?: number;
  categories?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CreatorsService {
  // Lo ideal es mover esta URL al fichero de environments si se usa Angular CLI
  // environment.ts o environment.prod.ts
  private baseUrl = 'http://localhost:3000/api';

  private cachedCategories: any[] | null = null;

  constructor(private http: HttpClient) {}

  // ------------------------------------------
  // CREADORES
  // ------------------------------------------
  /**
   * Retorna todos los creadores
   */
  getAllCreators(): Observable<Creator[]> {
    return this.http.get<Creator[]>(`${this.baseUrl}/creadors/`);
  }

  /**
   * Retorna un creador por su ID interno (p.e. 1, 2, etc.)
   */
  getCreatorById(id: string | number): Observable<Creator> {
    return this.http.get<Creator>(`${this.baseUrl}/creadors/${id}/`);
  }

  // ------------------------------------------
  // VÍDEOS
  // ------------------------------------------
  /**
   * Últimos vídeos de Twitch (máximo 1 por creador para no monopolizar).
   */
  getLastTwitchVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.baseUrl}/videos/ultims/twitch/`);
  }

  /**
   * Últimos vídeos de Youtube (máximo 1 por creador para no monopolizar).
   */
  getLastYoutubeVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.baseUrl}/videos/ultims/youtube/`);
  }

    /** Destacats de Twitch */
  getDestacatsTwitch(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/videos/destacats/twitch/`);
  }

  /** Destacats de YouTube */
  getDestacatsYoutube(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/videos/destacats/youtube/`);
  }

  /**
   * Obtiene vídeos por categoría y plataforma (Twitch o YouTube).
   * categoryId es el ID interno de la categoría (p.e. 1, 2, etc.).
   */
  getVideosByCategory(
    categoryId: string | number,
    platform: 'twitch' | 'youtube'
  ): Observable<Video[]> {
    return this.http.get<Video[]>(
      `${this.baseUrl}/videos/categoria/${categoryId}/${platform}/`
    );
  }

  // ------------------------------------------
  // DIRECTOS
  // ------------------------------------------
  /**
   * Directos actuales de Twitch
   */
  getTwitchDirectes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/directes/twitch/`);
  }

  // ------------------------------------------
  // CATEGORÍAS
  // ------------------------------------------
  /**
   * Obtiene todas las categorías disponibles
   */
  getCategories(forceRefresh = false): Observable<any[]> {
    if (!forceRefresh && this.cachedCategories) {
      // Devolvemos la cache en un observable
      return of(this.cachedCategories);
    } else {
      return this.http.get<any[]>(`${this.baseUrl}/categories/`).pipe(
        tap((categories) => {
          this.cachedCategories = categories;
        })
      );
    }
  }
  // ------------------------------------------
  // BÚSQUEDA
  // ------------------------------------------
  /**
   * Realiza una búsqueda utilizando el endpoint /cerca/ pasando los parámetros por GET.
   * Parámetros:
   * - text: string para buscar en sobrenom y descripción de un creador o título y descripción de un vídeo.
   * - type: array con los valores 'creadors' y/o 'vídeos'.
   * - platform: array con los valores 'twitch' y/o 'youtube'.
   * - categoria: array con los IDs de categorías para filtrar.
   */
  search(query: {
    text?: string;
    type?: string[];
    platform?: string[];
    categoria?: string[];
  }): Observable<any> {
    let params = new HttpParams();
    if (query.text) {
      params = params.set('text', query.text);
    }
    if (query.type && query.type.length > 0) {
      query.type.forEach((val) => {
        params = params.append('type[]', val);
      });
    }
    if (query.platform && query.platform.length > 0) {
      query.platform.forEach((val) => {
        params = params.append('platform[]', val);
      });
    }
    if (query.categoria && query.categoria.length > 0) {
      query.categoria.forEach((val) => {
        params = params.append('categoria[]', val);
      });
    }
    const url = `${this.baseUrl}/cerca/?${params.toString()}`;
    console.log('URL de cerca:', url);
    return this.http.get<any>(`${this.baseUrl}/cerca/`, { params });
  }
  
}
