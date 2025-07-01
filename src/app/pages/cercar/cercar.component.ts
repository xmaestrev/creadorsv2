import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CreatorsService, Creator } from '../../services/creators.service';

@Component({
  selector: 'app-cercar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cercar.component.html',
  styleUrls: ['./cercar.component.css'],
})
export class CercarComponent implements OnInit {
  /* ---------- parámetros de URL ---------- */
 /* ---------- parámetros de URL ---------- */
  text = ''; categoria = '';
  selectedSearchType: 'all' | 'videos' | 'creadors' = 'all';
  platform : string[] = [];
  type     : string[] = ['creadors','videos'];

  /* ---------- filtros FRONT ---------- */
  platformFilter:  'all' | 'twitch' | 'youtube' = 'all';
  orderFilter:     'recent' | 'oldest'          = 'recent';
  twitchTypeFilter:'all'   | 'clip'  | 'emission' = 'all';

  /* -------------- resultados -------------- */
  /** Lista filtrada que mostramos */
  videos:   any[] = [];
  creators: any[] = [];

  /** Copia “maestra” (sin filtrar)  */
  private masterVideos: any[] = [];

  /** Bloques para la UI */
  firstFourVideos:any[] = []; restOfVideos:any[] = [];
  firstFourCreators:any[] = []; restOfCreators:any[] = [];

  displayedRestVideosCount   = 8;
  displayedRestCreatorsCount = 8;
  isLoading = false;

  /* caché de creadores */
  private allCreators: Creator[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: CreatorsService
  ) {}

  /* =============== INIT =============== */
  /* =============== INIT =============== */
  ngOnInit(): void {
    this.api.getAllCreators().subscribe({
      next : list => { this.allCreators = list;  this.route.queryParams.subscribe(()=>this.loadResults()); },
      error:     _ => { this.allCreators = [];   this.route.queryParams.subscribe(()=>this.loadResults()); }
    });
  }
  

 /* ============ BÚSQUEDA =============== */
  private loadResults(): void {
    /* 1️⃣  leer query-params */
    const p = this.route.snapshot.queryParamMap;
    this.text       = p.get('text') || '';
    this.categoria  = p.get('categoria') || '';
    if (this.categoria === 'todas') this.categoria = '';
    this.selectedSearchType = (p.get('selectedSearchType') as any) || 'all';
    this.type     = p.getAll('type[]').length      ? p.getAll('type[]')     : ['creadors','videos'];
    this.platform = p.getAll('platform[]').length ? p.getAll('platform[]') : [];

    const query = {
      text      : this.text || undefined,
      type      : this.text
                   ? this.getTypeFromSearchSelect()
                   : this.categoria ? ['creadors','videos'] : this.type,
      platform  : this.platform,
      categoria : this.categoria ? [this.categoria] : []
    };

    this.isLoading = true;

    /* 2️⃣  llamada al endpoint */
    this.api.search(query).subscribe({
      next : data => {
        const flat = this.unpack(data);
        const vids = flat.filter(x => this.isVideo(x));
        const crs  = flat.filter(x => !this.isVideo(x));
        this.processResults(vids, crs);
      },
      error: err => { console.error('Error en /cerca:', err); this.isLoading = false; }
    });
  }

  /* ======= POST-PROCESADO ======= */
  private processResults(rawVideos:any[], rawCreators:any[]){
    /* 1. mapeo y cache “maestra” */
    this.masterVideos = rawVideos.map(v => this.mapVideo(v));
    this.videos       = [...this.masterVideos];
    this.creators     = rawCreators;

    /* 2. añadimos info de creador */
    this.assignCreatorInfo(this.videos);
    this.assignCreatorInfo(this.creators,false);

    /* 3. aplicamos filtros iniciales + bloques */
    this.applyVideoFilters();
    this.applyTypeFilter();
    this.splitBlocks();

    this.isLoading = false;
  }

  /* ============ UTILIDADES ============= */

  /** ▶️ método que invoca la plantilla cuando cambian combos */
  onFiltersChanged(): void {
    this.applyVideoFilters();
    this.splitBlocks();
  }

  
  /* --------------  NUEVO -------------- */
  /** Restaura los selectores a sus valores por defecto */
  resetVideoFilters(): void {
    this.platformFilter   = 'all';
    this.orderFilter      = 'recent';
    this.twitchTypeFilter = 'all';
    this.onFiltersChanged();          // recalcula la lista + bloques
  }

  private unpack(src: any): any[] {
    if (!src) return [];
    if (Array.isArray(src)) {
      // array plano o [creador+vídeos]
      const out: any[] = [];
      src.forEach((o) => {
        out.push(o);
        if (o.videos && typeof o.videos === 'object') {
          Object.values(o.videos).forEach((grp: any) => {
            if (Array.isArray(grp)) out.push(...grp);
            else if (grp && typeof grp === 'object') {
              Object.values(grp).forEach(
                (l: any) => Array.isArray(l) && out.push(...l)
              );
            }
          });
        }
      });
      return out;
    }
    if (Array.isArray(src.results)) return src.results; // formato antiguo

    /* { creadors:[…], videos:{…} } */
    const out: any[] = [];
    if (Array.isArray(src.creadors)) out.push(...src.creadors);
    if (src.videos && typeof src.videos === 'object') {
      Object.values(src.videos).forEach((grp: any) => {
        if (Array.isArray(grp)) out.push(...grp);
        else if (grp && typeof grp === 'object') {
          Object.values(grp).forEach(
            (l: any) => Array.isArray(l) && out.push(...l)
          );
        }
      });
    }
    return out;
  }

  private isVideo(it: any) {
    const u = it.url || it.embed_url || it.link;
    return u && (u.includes('youtube') || u.includes('twitch'));
  }

  private getTypeFromSearchSelect() {
    return this.selectedSearchType === 'all'
      ? ['videos', 'creadors']
      : [this.selectedSearchType];
  }
  

  private mapVideo(v: any) {
    // 1️⃣  Mini-normalización de thumbnail (mantengo tu lógica)
    let thumb = v.thumbnail_url;
    if (thumb?.includes('%{width}')) {
      thumb = thumb
        .replace(/%\{width\}/g, '320')
        .replace(/%\{height\}/g, '180');
    }

    // 2️⃣  Plataforma
    const isYT = (v.url || v.embed_url)?.includes('youtube');
    const isTTV = (v.url || v.embed_url)?.includes('twitch');

    // 3️⃣  Tipo dentro de Twitch: clip / emission
    let rawType = (v.type || v.tipus || '').toLowerCase(); //  «tipus» viene del endpoint :contentReference[oaicite:2]{index=2}
    if (rawType === 'clips') rawType = 'clip';
    if (rawType.startsWith('emi')) rawType = 'emission'; // “emision”, “emisions”, “emissions”...

    // 4️⃣  Fecha de creación
    //    – viene como ‘YYYY-MM-DD hh:mm:ss’  ➜  conviene meterle la T para que Date lo trague.
    const createdAt = v.created_at
      ? new Date(v.created_at.replace(' ', 'T'))
      : new Date(0); // fallback lejano

    return {
      url: v.url || v.embed_url,
      thumbnail: thumb,
      title: v.title,
      description: v.description,
      creatorId: v.creatorId || v.creator_id || '1',
      duration: v.duration ? `${v.duration}s` : '',
      platform: isYT ? 'youtube' : isTTV ? 'twitch' : 'unknown',
      videoKind: isTTV ? rawType || 'emission' : 'video', // YT → “video” genérico
      createdAt, //  ⬅️  nuevo
    };
  }

  private assignCreatorInfo(arr: any[], isVideo = true) {
    const dflt = 'assets/img/default-creator-profile.png';
    const map = this.allCreators.reduce(
      (a, c) => ({
        ...a,
        [c.creatorId]: { name: c.name, img: c.imageUrl || dflt },
      }),
      {} as any
    );
    arr.forEach((i) => {
      const info = map[i.creatorId] || { name: 'Unknown', img: dflt };
      i.creator = info.name;
      i.creatorImage = info.img;
    });
  }

  /* -------- filtros UI -------- */
  applyVideoFilters(): void {
    /* siempre partimos de la lista maestra */
    let list = [...this.masterVideos];

    /* Plataforma */
    if (this.platformFilter === 'twitch')  list = list.filter(v => v.platform === 'twitch');
    if (this.platformFilter === 'youtube') list = list.filter(v => v.platform === 'youtube');

    /* Tipo Twitch */
    if (this.platformFilter !== 'youtube') {
      if (this.twitchTypeFilter === 'clip')     list = list.filter(v => v.videoKind === 'clip');
      else if (this.twitchTypeFilter === 'emission') list = list.filter(v => v.videoKind === 'emission');
    }

    /* Orden */
    list.sort((a,b) =>
      this.orderFilter === 'recent'
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime());

    this.videos = list;
  }

  private applyTypeFilter() {
    if (this.selectedSearchType === 'videos') this.creators = [];
    if (this.selectedSearchType === 'creadors') this.videos = [];
  }

  private splitBlocks() {
    this.firstFourVideos = this.videos.slice(0, 4);
    this.restOfVideos = this.videos.slice(4);
    this.firstFourCreators = this.creators.slice(0, 4);
    this.restOfCreators = this.creators.slice(4);
    this.displayedRestVideosCount = 8;
    this.displayedRestCreatorsCount = 8;
  }

  /* ---------- paginación ---------- */
  loadMoreVideos() {
    this.displayedRestVideosCount += 8;
  }
  loadMoreCreators() {
    this.displayedRestCreatorsCount += 8;
  }

  /* ---------- navegación ---------- */
  navigateToVideo(v: any) {
    if (v.url.includes('youtube')) {
      const id = v.url.split('v=')[1];
      this.router.navigate(['/video'], {
        queryParams: { videoID: id, creatorId: v.creatorId },
      });
    } else window.open(v.url, '_blank', 'noopener');
  }
  navigateToCreator(c: any) {
    this.router.navigate(['/creador'], { queryParams: { id: c.creatorId } });
  }
}
