import { Component, inject, AfterViewInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  ModalController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { GeolocationService } from '../../core/services/geolocation.service';
import { MapService } from '../../core/services/map.service';
import { PhotoService, UserPhoto } from '../../core/services/photo.service';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';
import { ClusterListComponent } from '../cluster-list/cluster-list.component';

const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner],
})
export class Tab2Page implements AfterViewInit, ViewWillEnter {
  private geolocationService = inject(GeolocationService);
  private mapService = inject(MapService);
  private photoService = inject(PhotoService);
  private modalController = inject(ModalController);
  protected mapLoaded = false;

  async ngAfterViewInit() {
    const position =
      (await this.geolocationService.getCurrentPosition()) ?? DEFAULT_CENTER;
    await this.mapService.initMap('map', position.lat, position.lng);
    this.mapLoaded = true;
    await this.refresh();
  }

  async ionViewWillEnter() {
    if (this.mapLoaded) {
      await this.refresh();
    }
  }

  private async refresh() {
    await this.photoService.loadSaved();
    this.mapService.showPhotos(
      this.photoService.photos,
      (photos, index) => this.openDetail(photos, index),
      (photos) => this.openClusterList(photos),
    );
  }

  private async openDetail(photos: UserPhoto[], index: number) {
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: { photos, initialSlide: index },
    });
    await modal.present();
  }

  private async openClusterList(photos: UserPhoto[]) {
    const modal = await this.modalController.create({
      component: ClusterListComponent,
      componentProps: { photos },
    });
    await modal.present();
  }
}
