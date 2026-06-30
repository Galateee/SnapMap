import { Injectable, inject } from '@angular/core';
import { Camera, MediaResult } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { GeolocationService } from './geolocation.service';

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
  purchased: boolean;
  liked: boolean;
  dateTaken: number;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private geolocationService = inject(GeolocationService);

  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE = 'photos';

  public async takePhoto(onCaptured?: () => void, onSaved?: () => void) {
    const result = await Camera.takePhoto({ quality: 100 });
    onCaptured?.();
    const position = await this.geolocationService.getCurrentPosition();
    const savedPhoto = await this.savePhoto(result, position);
    this.photos.unshift(savedPhoto);
    onSaved?.();
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  private async savePhoto(
    cameraPhoto: MediaResult,
    position: { lat: number; lng: number } | null,
  ): Promise<UserPhoto> {
    const base64Data = await this.readAsBase64(cameraPhoto);
    const dateTaken = new Date().getTime();
    const fileName = dateTaken + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
    return {
      filepath: fileName,
      webviewPath: base64Data,
      purchased: false,
      liked: false,
      dateTaken,
      latitude: position?.lat,
      longitude: position?.lng,
    };
  }

  private async readAsBase64(cameraPhoto: MediaResult): Promise<string> {
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
  }

  private convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  public async loadSaved() {
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    const stored = (value ? JSON.parse(value) : []) as UserPhoto[];
    const loaded: UserPhoto[] = [];
    for (const photo of stored) {
      try {
        const file = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        loaded.push(photo);
      } catch {}
    }
    this.photos = loaded;
  }

  public async markAsPurchased(filepath: string) {
    const photo = this.photos.find((p) => p.filepath === filepath);
    if (photo) {
      photo.purchased = true;
      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos),
      });
    }
  }

  public async toggleLike(filepath: string) {
    const photo = this.photos.find((p) => p.filepath === filepath);
    if (photo) {
      photo.liked = !photo.liked;
      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos),
      });
    }
  }

  public async deletePhoto(filepath: string) {
    this.photos = this.photos.filter((p) => p.filepath !== filepath);
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data,
      });
    } catch {}
  }
}
