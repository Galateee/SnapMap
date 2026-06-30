import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonSkeletonText,
  ModalController,
} from '@ionic/angular/standalone';
import { PhotoService, UserPhoto } from '../../core/services/photo.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';
import { addIcons } from 'ionicons';
import { lockClosed, lockOpen, expand } from 'ionicons/icons';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonSkeletonText,
  ],
})
export class Tab3Page implements OnInit {
  photoService = inject(PhotoService);
  private paymentService = inject(PaymentService);
  private notification = inject(NotificationService);
  private modalController = inject(ModalController);

  protected isLoading = false;
  protected readonly skeletonItems = [0, 1, 2, 3];

  constructor() {
    addIcons({ lockClosed, lockOpen, expand });
  }

  async openPhoto(photo: UserPhoto) {
    if (!photo.purchased) {
      return;
    }
    const purchased = this.photoService.photos.filter((p) => p.purchased);
    const index = purchased.findIndex((p) => p.filepath === photo.filepath);
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: {
        photos: purchased,
        initialSlide: Math.max(index, 0),
      },
    });
    await modal.present();
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      await this.photoService.loadSaved();
    } finally {
      this.isLoading = false;
    }
  }

  async buyPhoto(filepath: string) {
    const success = await this.paymentService.buyPhoto();
    await this.handlePaymentResult(filepath, success);
  }

  async buyPhotoWithGooglePay(filepath: string) {
    const available = await this.paymentService.isGooglePayAvailable();
    if (!available) {
      await this.notification.info('Google Pay indisponible sur cet appareil');
      return;
    }
    const success = await this.paymentService.buyPhotoWithGooglePay();
    await this.handlePaymentResult(filepath, success);
  }

  private async handlePaymentResult(filepath: string, success: boolean) {
    if (success) {
      await this.photoService.markAsPurchased(filepath);
      await this.notification.success('Achat réussi 🎉');
    } else {
      await this.notification.error('Paiement annulé ou échoué');
    }
  }
}
