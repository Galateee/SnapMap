import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MapService {
  map: mapboxgl.Map | undefined;
  style = 'mapbox://styles/mapbox/streets-v11';

  initMap(container: string, lat: number, lng: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.map = new mapboxgl.Map({
        accessToken: environment.mapBox.accessToken,
        container,
        style: this.style,
        zoom: 13,
        center: [lng, lat],
      });
      this.map.on('load', () => {
        this.addMarker(lng, lat);
        resolve();
      });
      this.map.on('error', (err) => {
        reject(err);
      });
    });
  }

  addMarker(lng: number, lat: number): void {
    new mapboxgl.Marker({ color: '#810adc' })
      .setLngLat([lng, lat])
      .addTo(this.map!);
  }
}
