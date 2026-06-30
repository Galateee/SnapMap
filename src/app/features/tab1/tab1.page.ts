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
  IonSkeletonText,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, heart, heartOutline, trash } from 'ionicons/icons';
import { PhotoService, UserPhoto } from '../../core/services/photo.service';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';
import { NotificationService } from '../../core/services/notification.service';

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
    IonSkeletonText,
    IonSpinner,
  ],
})
export class Tab1Page implements OnInit {
  public photoService = inject(PhotoService);
  private modalController = inject(ModalController);
  private notification = inject(NotificationService);

  protected isLoading = false;
  protected isAddingPhoto = false;
  protected readonly skeletonItems = [0, 1, 2, 3];

  constructor() {
    addIcons({ camera, heart, heartOutline, trash });
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      await this.photoService.loadSaved();
    } finally {
      this.isLoading = false;
    }
  }

  async takePhoto() {
    try {
      await this.photoService.takePhoto(
        () => (this.isAddingPhoto = true),
        () => (this.isAddingPhoto = false),
      );
      await this.notification.success('Photo ajoutée');
    } catch (error) {
      const kind = this.classifyCameraError(error);
      if (kind === 'denied') {
        await this.notification.error(
          'Accès à la caméra refusé. Autorisez-le dans les réglages.',
        );
      } else if (kind === 'error') {
        await this.notification.error("Impossible d'ajouter la photo");
      }
    } finally {
      this.isAddingPhoto = false;
    }
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

  async toggleLike(photo: UserPhoto) {
    await this.photoService.toggleLike(photo.filepath);
    await this.notification.success(
      photo.liked ? 'Ajouté aux favoris' : 'Retiré des favoris',
    );
  }

  async confirmDelete(filepath: string) {
    const confirmed = await this.notification.confirm({
      header: 'Supprimer la photo',
      message: 'Cette action est définitive. Confirmer la suppression ?',
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    await this.photoService.deletePhoto(filepath);
    await this.notification.success('Photo supprimée');
  }

  private classifyCameraError(error: unknown): 'cancel' | 'denied' | 'error' {
    const message = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();
    if (message.includes('cancel')) {
      return 'cancel';
    }
    if (message.includes('denied') || message.includes('permission')) {
      return 'denied';
    }
    return 'error';
  }
}
