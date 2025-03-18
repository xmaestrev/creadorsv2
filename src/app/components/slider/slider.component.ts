import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { Router } from '@angular/router';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.css'],
    standalone: true,
    imports: [CommonModule, CarouselModule]
})
export class SliderComponent {
  
  /** Título que aparece encima del carrusel */
  @Input() title: string = '';

  /** Datos a mostrar en el carrusel (se pasan desde el padre) */
  @Input() items: any[] = [];

  /** Cuántos ítems se ven en pantallas grandes */
  @Input() numVisible: number = 4;

  /** Cuántos ítems avanza por cada flecha */
  @Input() numScroll: number = 1;

  /** Opciones responsivas */
  @Input() responsiveOptions: any;

  /** ¿Hacer el carrusel circular? */
  @Input() circular: boolean = true;

  /** Autoplay interval en ms */
  @Input() autoplayInterval: number = 0;

  /** Mostrar indicadores en el carrusel */
  @Input() showIndicators: boolean = true;

  constructor(private router: Router) {}

  /** Método para navegar a un video */
  navigateToVideo(videoUrl: string, creatorId: string): void {
    if (videoUrl.includes('youtube')) {
      // Navega a la ruta /video pasando el videoID (extraído de la URL) y el creatorId
      const videoID = videoUrl.split('v=')[1];
      this.router.navigate(['/video'], { queryParams: { videoID, creatorId } });
    } else if (videoUrl.includes('twitch')) {
      // Si es de Twitch (clip o emisión), abrir el enlace en una nueva pestaña
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } else {
      // En cualquier otro caso, abrir en nueva pestaña
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  }

  navigateToCreator(creatorId: any): void {
    if (creatorId) {
      this.router.navigate(['/creador'], { queryParams: { id: creatorId } });
    } else {
      console.warn('El item no tiene creatorId definido.');
    }
  }
  
}
