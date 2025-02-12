import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.css'],
    imports: [CommonModule, CarouselModule]
})
export class SliderComponent {
  /** Título que aparece encima del carrusel */
  @Input() title: string = '';

  /** Datos a mostrar, por ejemplo un array de objetos con thumbnail, título, etc. */
  @Input() items: any[] = [];

  /** Cuántos ítems se ven en pantallas grandes */
  @Input() numVisible: number = 4;

  /** Cuántos ítems avanza por cada flecha */
  @Input() numScroll: number = 1;

  /** Opciones responsivas, para adaptar numVisible y numScroll a distintos breakpoints */
  @Input() responsiveOptions: any;

  /** ¿Hacer el carrusel circular? (vuelve al inicio) */
  @Input() circular: boolean = true;

  /** Autoplay interval en ms (0 = sin autoplay) */
  @Input() autoplayInterval: number = 0;

  // Puedes añadir más @Input() si deseas controlar p-carousel
}
