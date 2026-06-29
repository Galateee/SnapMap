import { Component, inject, AfterViewInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { GeolocationService } from '../../core/services/geolocation.service';
import { MapService } from '../../core/services/map.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner],
})
export class Tab2Page implements AfterViewInit {
  private geolocationService = inject(GeolocationService);
  private mapService = inject(MapService);
  protected mapLoaded: boolean = false;

  ngAfterViewInit() {
    this.geolocationService.getCurrentPosition().then(async (position) => {
      if (position) {
        await this.mapService.initMap('map', position.lat, position.lng);
        this.mapLoaded = true;
      } else {
        console.error('Could not get current position');
      }
    });
  }
}
