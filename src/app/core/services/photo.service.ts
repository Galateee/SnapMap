import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public webPath?: string;

  public async takePhoto() {
    const result = await Camera.takePhoto({ quality: 100 });
    this.webPath = result.webPath;
  }
}
