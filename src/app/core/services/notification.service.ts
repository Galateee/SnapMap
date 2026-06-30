import { inject, Injectable } from '@angular/core';
import {
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';

const SUCCESS_DURATION = 2000;
const ERROR_DURATION = 3000;
const INFO_DURATION = 2000;

interface ConfirmOptions {
  header: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  async success(message: string): Promise<void> {
    await this.toast(message, 'success', SUCCESS_DURATION);
  }

  async error(message: string): Promise<void> {
    await this.toast(message, 'danger', ERROR_DURATION);
  }

  async info(message: string): Promise<void> {
    await this.toast(message, 'medium', INFO_DURATION);
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertController.create({
      header: options.header,
      message: options.message,
      buttons: [
        { text: options.cancelText ?? 'Annuler', role: 'cancel' },
        {
          text: options.confirmText ?? 'Confirmer',
          role: options.destructive ? 'destructive' : 'confirm',
        },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm' || role === 'destructive';
  }

  private async toast(
    message: string,
    color: string,
    duration: number,
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
