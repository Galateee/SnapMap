import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  GooglePayEventsEnum,
  PaymentSheetEventsEnum,
  Stripe,
} from '@capacitor-community/stripe';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom, first } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);

  private readonly apiUrl =
    Capacitor.getPlatform() === 'android'
      ? environment.paymentApiUrlAndroid
      : environment.paymentApiUrl;

  constructor() {
    Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
      console.log('PaymentSheetEventsEnum.Completed');
    });
    Stripe.addListener(GooglePayEventsEnum.Completed, () => {
      console.log('GooglePayEventsEnum.Completed');
    });
  }

  async buyPhoto(): Promise<boolean> {
    try {
      const { paymentIntent, ephemeralKey, customer } = await firstValueFrom(
        this.http
          .post<{
            paymentIntent: string;
            ephemeralKey: string;
            customer: string;
          }>(this.apiUrl + '/payment-sheet', {})
          .pipe(first()),
      );

      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: 'Ma Boutique Photo',
        countryCode: 'FR',
      });

      const result = await Stripe.presentPaymentSheet();
      return result.paymentResult === PaymentSheetEventsEnum.Completed;
    } catch (err) {
      console.error('buyPhoto failed:', err);
      return false;
    }
  }

  async buyPhotoWithGooglePay(): Promise<boolean> {
    const { paymentIntent } = await firstValueFrom(
      this.http
        .post<{
          paymentIntent: string;
          ephemeralKey: string;
          customer: string;
        }>(this.apiUrl + '/payment-sheet', {})
        .pipe(first()),
    );

    try {
      await Stripe.createGooglePay({
        paymentIntentClientSecret: paymentIntent,
        paymentSummaryItems: [{ label: 'Photo', amount: 5.0 }],
        countryCode: 'FR',
        currency: 'EUR',
      });
    } catch (err) {
      console.error('createGooglePay failed:', err);
      return false;
    }

    const result = await Stripe.presentGooglePay();
    return result.paymentResult === GooglePayEventsEnum.Completed;
  }
}
