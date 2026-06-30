import { Component, inject, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { UserPhoto } from '../../core/services/photo.service';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';

@Component({
  selector: 'app-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
  ],
})
export class ClusterListComponent {
  @Input() photos: UserPhoto[] = [];

  private modalController = inject(ModalController);

  constructor() {
    addIcons({ close });
  }

  protected dismiss() {
    this.modalController.dismiss();
  }

  protected async openPhoto(index: number) {
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: { photos: this.photos, initialSlide: index },
    });
    await modal.present();
  }
}
