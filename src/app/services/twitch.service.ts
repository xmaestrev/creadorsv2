import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

const TWITCH_CLIENT_ID = '5mpk1fi25r9te68mscjotvxkptgilz';
const TWITCH_CLIENT_SECRET = '9kkfmsoay0f036r7dl2v87byreo8pv';
const TWITCH_API_URL = 'https://api.twitch.tv/helix';
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';

@Injectable({
  providedIn: 'root'
})
export class TwitchService {
  private accessToken: string = '';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el token de acceso mediante el método client credentials.
   */
  getAccessToken(): Observable<any> {
    const params = new HttpParams()
      .set('client_id', TWITCH_CLIENT_ID)
      .set('client_secret', TWITCH_CLIENT_SECRET)
      .set('grant_type', 'client_credentials');

    return this.http.post(TWITCH_AUTH_URL, params);
  }

  /**
   * Obtiene los streams de Twitch para los user_logins proporcionados.
   * Si no se tiene token, se solicita y se almacena.
   */
  getStreamsByUserLogins(userLogins: string[]): Observable<any> {
    if (this.accessToken) {
      return this.fetchStreamsByUserLogins(userLogins);
    } else {
      return this.getAccessToken().pipe(
        switchMap(response => {
          this.accessToken = response.access_token;
          return this.fetchStreamsByUserLogins(userLogins);
        })
      );
    }
  }

  /**
   * Realiza la llamada a la API de Twitch para obtener los streams.
   */
  private fetchStreamsByUserLogins(userLogins: string[]): Observable<any> {
    const headers = new HttpHeaders({
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${this.accessToken}`
    });
    const params = new HttpParams().set('user_login', userLogins.join(','));
    return this.http.get(`${TWITCH_API_URL}/streams`, { headers, params });
  }
}
