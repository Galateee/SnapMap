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
  ToastController,
} from '@ionic/angular/standalone';
import { PhotoService } from '../../core/services/photo.service';
import { PaymentService } from '../../core/services/payment.service';
import { addIcons } from 'ionicons';
import { lockClosed, lockOpen } from 'ionicons/icons';

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
  ],
})
export class Tab3Page implements OnInit {
  photoService = inject(PhotoService);
  paymentService = inject(PaymentService);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({ lockClosed, lockOpen });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async buyPhoto(filepath: string) {
    const success = await this.paymentService.buyPhoto();
    if (success) {
      await this.photoService.markAsPurchased(filepath);
    }
  }

  async buyPhotoWithGooglePay(filepath: string) {
    const available = await this.paymentService.isGooglePayAvailable();
    if (!available) {
      await this.showToast('Google Pay indisponible sur cet appareil');
      return;
    }
    const success = await this.paymentService.buyPhotoWithGooglePay();
    if (success) {
      await this.photoService.markAsPurchased(filepath);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
    });
    await toast.present();
  }
}
