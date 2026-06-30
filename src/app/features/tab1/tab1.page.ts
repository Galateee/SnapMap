import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonButton,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, heart, heartOutline, trash } from 'ionicons/icons';
import { PhotoService } from '../../core/services/photo.service';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonButton,
  ],
})
export class Tab1Page implements OnInit {
  public photoService = inject(PhotoService);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  constructor() {
    addIcons({ camera, heart, heartOutline, trash });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  takePhoto() {
    this.photoService.takePhoto();
  }

  async openPhoto(index: number) {
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: {
        photos: this.photoService.photos,
        initialSlide: index,
      },
    });
    await modal.present();
  }

  toggleLike(filepath: string) {
    this.photoService.toggleLike(filepath);
  }

  async confirmDelete(filepath: string) {
    const alert = await this.alertController.create({
      header: 'Supprimer la photo',
      message: 'Cette action est définitive. Confirmer la suppression ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.photoService.deletePhoto(filepath);
          },
        },
      ],
    });
    await alert.present();
  }
}
