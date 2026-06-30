import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Stripe } from '@capacitor-community/stripe';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({ close });
    Stripe.initialize({
      publishableKey: environment.stripe.publishableKey,
    });
  }
}
