import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { UserPhoto } from '../../core/services/photo.service';
import { GeocodingService } from '../../core/services/geocoding.service';

@Component({
  selector: 'app-photo-detail',
  templateUrl: './photo-detail.component.html',
  styleUrls: ['./photo-detail.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    DatePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PhotoDetailComponent implements OnInit {
  @Input() photos: UserPhoto[] = [];
  @Input() initialSlide = 0;

  private modalController = inject(ModalController);
  private geocodingService = inject(GeocodingService);

  protected locations: Record<string, string> = {};

  constructor() {
    addIcons({ close });
  }

  ngOnInit() {
    this.resolveLocation(this.photos[this.initialSlide]);
  }

  protected getDate(photo: UserPhoto): number {
    return photo.dateTaken ?? parseInt(photo.filepath, 10);
  }

  protected onSlideChange(event: Event) {
    const swiper = (event as CustomEvent).detail?.[0];
    const index = swiper?.activeIndex ?? 0;
    this.resolveLocation(this.photos[index]);
  }

  protected dismiss() {
    this.modalController.dismiss();
  }

  private async resolveLocation(photo: UserPhoto | undefined) {
    if (!photo || this.locations[photo.filepath]) {
      return;
    }
    if (photo.latitude == null || photo.longitude == null) {
      this.locations[photo.filepath] = 'Localisation indisponible';
      return;
    }
    const name = await this.geocodingService.reverseGeocode(
      photo.longitude,
      photo.latitude,
    );
    this.locations[photo.filepath] = name ?? 'Lieu inconnu';
  }
}
