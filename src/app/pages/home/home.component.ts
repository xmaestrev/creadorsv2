// src/app/pages/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderComponent } from '../../components/slider/slider.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [CommonModule, SliderComponent]
})
export class HomeComponent implements OnInit {
  
  liveChannels = Array(6).fill({
    title: 'Títol en directe',
    creator: 'NomCreador',
    categories: ['Cat 1', 'Cat 2', 'Cat 3'],
    description: 'Descripció del directe...',
    duration: '2:15:00',
    isLive: true
  });

  mostViewed = Array(6).fill({
    title: 'Títol més vist',
    creator: 'NomCreador',
    categories: ['Cat 1', 'Cat 2'],
    description: 'Vídeo més vist avui...',
    duration: '10:00'
  });

  featured = Array(6).fill({
    title: 'Títol destacat',
    creator: 'NomCreador',
    categories: ['Cat 3'],
    description: 'Altre destacat...',
    duration: '15:00'
  });

  responsiveOptions = [
  ];

  constructor() {}

  ngOnInit(): void {
  
  }
}
