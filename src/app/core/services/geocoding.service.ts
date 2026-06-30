import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface MapboxGeocodingResponse {
  features: { place_name: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private http = inject(HttpClient);

  async reverseGeocode(lng: number, lat: number): Promise<string | null> {
    const token = environment.mapBox.accessToken;
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${token}&language=fr&limit=1`;
    try {
      const response = await firstValueFrom(
        this.http.get<MapboxGeocodingResponse>(url),
      );
      return response.features?.[0]?.place_name ?? null;
    } catch (err) {
      console.error('reverseGeocode failed:', err);
      return null;
    }
  }
}
