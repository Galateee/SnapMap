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
} from '@ionic/angular/standalone';
import { PhotoService } from '../../core/services/photo.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
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
    IonSkeletonText,
  ],
})
export class Tab3Page implements OnInit {
  photoService = inject(PhotoService);
  private paymentService = inject(PaymentService);
  private notification = inject(NotificationService);

  protected isLoading = false;
  protected readonly skeletonItems = [0, 1, 2, 3];

  constructor() {
    addIcons({ lockClosed, lockOpen });
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
    const success = await this.notification.withLoading(
      'Paiement en cours…',
      () => this.paymentService.buyPhoto(),
    );
    await this.handlePaymentResult(filepath, success);
  }

  async buyPhotoWithGooglePay(filepath: string) {
    const available = await this.paymentService.isGooglePayAvailable();
    if (!available) {
      await this.notification.info('Google Pay indisponible sur cet appareil');
      return;
    }
    const success = await this.notification.withLoading(
      'Paiement Google Pay…',
      () => this.paymentService.buyPhotoWithGooglePay(),
    );
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
