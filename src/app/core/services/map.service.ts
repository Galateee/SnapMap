import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import { environment } from '../../../environments/environment';
import { UserPhoto } from './photo.service';

type PhotoProps = { photoIndex: number };
type SelectHandler = (photos: UserPhoto[], index: number) => void;
type ClusterHandler = (photos: UserPhoto[]) => void;

const CLUSTER_RADIUS = 60;
const CLUSTER_MAX_ZOOM = 18;
const SPIDERFY_MAX_LEAVES = 6;
const MARKER_SIZE = 54;
const LEAF_GAP = 18;
const MIN_SPIDER_RADIUS = 74;
const MAX_SPIDER_RADIUS = 132;
const STAGGER_MS = 28;
const BADGE_MAX = 99;
const BBOX_PADDING = 0.3;
const SVG_NS = 'http://www.w3.org/2000/svg';

@Injectable({ providedIn: 'root' })
export class MapService {
  map: mapboxgl.Map | undefined;
  style = 'mapbox://styles/mapbox/streets-v11';

  private index: Supercluster<PhotoProps> | undefined;
  private markers = new Map<string, mapboxgl.Marker>();
  private geoPhotos: UserPhoto[] = [];
  private onSelect: SelectHandler = () => {};
  private onClusterOpen: ClusterHandler = () => {};
  private spiderOverlay: HTMLElement | undefined;
  private spiderOrigin: HTMLElement | undefined;
  private spiderOpen = false;
  private backdrop: HTMLElement | undefined;
  private fitted = false;

  initMap(container: string, lat: number, lng: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.map = new mapboxgl.Map({
        accessToken: environment.mapBox.accessToken,
        container,
        style: this.style,
        zoom: 13,
        center: [lng, lat],
      });
      this.map.on('load', () => {
        this.addUserMarker(lng, lat);
        this.map!.on('moveend', () => this.render());
        resolve();
      });
      this.map.on('error', (err) => reject(err));
    });
  }

  resize(): void {
    this.map?.resize();
  }

  showPhotos(
    photos: UserPhoto[],
    onSelect: SelectHandler,
    onClusterOpen: ClusterHandler,
  ): void {
    if (!this.map) {
      return;
    }
    this.onSelect = onSelect;
    this.onClusterOpen = onClusterOpen;
    this.geoPhotos = photos.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    this.index = new Supercluster<PhotoProps>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
    });
    this.index.load(
      this.geoPhotos.map((p, i) => ({
        type: 'Feature',
        properties: { photoIndex: i },
        geometry: {
          type: 'Point',
          coordinates: [p.longitude as number, p.latitude as number],
        },
      })),
    );
    this.fitToPhotos();
    this.clearMarkers();
    this.render();
  }

  private render(): void {
    if (!this.map || !this.index) {
      return;
    }
    this.collapseSpider();
    const bounds = this.map.getBounds();
    if (!bounds) {
      return;
    }
    const zoom = Math.floor(this.map.getZoom());
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const padX = (east - west) * BBOX_PADDING;
    const padY = (north - south) * BBOX_PADDING;
    const clusters = this.index.getClusters(
      [
        west - padX,
        Math.max(-90, south - padY),
        east + padX,
        Math.min(90, north + padY),
      ],
      zoom,
    );
    const next = new Set<string>();
    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as Supercluster.ClusterProperties &
        PhotoProps;
      const isCluster = !!props.cluster;
      const id = isCluster
        ? `cluster-${props.cluster_id}`
        : `point-${props.photoIndex}`;
      next.add(id);
      if (this.markers.has(id)) {
        continue;
      }
      const el = isCluster
        ? this.buildClusterElement(props.cluster_id, props.point_count)
        : this.buildSingleElement(props.photoIndex);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(this.map);
      this.markers.set(id, marker);
    }
    for (const [id, marker] of this.markers) {
      if (!next.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }
  }

  private buildSingleElement(photoIndex: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'snap-marker';
    el.appendChild(this.buildPin(this.geoPhotos[photoIndex].webviewPath));
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onSelect(this.geoPhotos, photoIndex);
    });
    return el;
  }

  private buildClusterElement(clusterId: number, count: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'snap-marker snap-marker--cluster';
    const leaves = this.index!.getLeaves(clusterId, 1);
    const firstIndex = (leaves[0].properties as PhotoProps).photoIndex;
    el.appendChild(this.buildPin(this.geoPhotos[firstIndex].webviewPath));
    const badge = document.createElement('span');
    badge.className = 'snap-badge';
    badge.textContent = count > BADGE_MAX ? `${BADGE_MAX}+` : `${count}`;
    el.appendChild(badge);
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onClusterClick(clusterId, count);
    });
    return el;
  }

  private onClusterClick(clusterId: number, count: number): void {
    if (!this.map || !this.index) {
      return;
    }
    if (count <= SPIDERFY_MAX_LEAVES) {
      this.spiderfy(clusterId);
      return;
    }
    const photos = this.index
      .getLeaves(clusterId, Infinity)
      .map(
        (leaf) => this.geoPhotos[(leaf.properties as PhotoProps).photoIndex],
      );
    this.onClusterOpen(photos);
  }

  private spiderfy(clusterId: number): void {
    if (!this.map || !this.index) {
      return;
    }
    this.collapseSpider();
    const originEl = this.markers.get(`cluster-${clusterId}`)?.getElement();
    if (!originEl) {
      return;
    }
    const leaves = this.index.getLeaves(clusterId, Infinity);
    const total = leaves.length;
    const radius = Math.min(
      Math.max(
        MIN_SPIDER_RADIUS,
        (MARKER_SIZE + LEAF_GAP) / (2 * Math.sin(Math.PI / total)),
      ),
      MAX_SPIDER_RADIUS,
    );

    const overlay = document.createElement('div');
    overlay.className = 'snap-spider';
    const box = radius * 2 + MARKER_SIZE * 2;
    const legs = document.createElementNS(SVG_NS, 'svg');
    legs.setAttribute('class', 'snap-spider__legs');
    legs.setAttribute('width', `${box}`);
    legs.setAttribute('height', `${box}`);
    legs.style.left = `${-box / 2}px`;
    legs.style.top = `${-box / 2}px`;
    overlay.appendChild(legs);

    leaves.forEach((leaf, i) => {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      const leg = document.createElementNS(SVG_NS, 'line');
      leg.setAttribute('x1', `${box / 2}`);
      leg.setAttribute('y1', `${box / 2}`);
      leg.setAttribute('x2', `${box / 2 + dx}`);
      leg.setAttribute('y2', `${box / 2 + dy}`);
      leg.setAttribute('class', 'snap-spider__leg');
      leg.style.strokeDasharray = `${radius}`;
      leg.style.strokeDashoffset = `${radius}`;
      leg.style.transitionDelay = `${i * STAGGER_MS}ms`;
      legs.appendChild(leg);
      const photoIndex = (leaf.properties as PhotoProps).photoIndex;
      overlay.appendChild(this.buildLeafElement(photoIndex, dx, dy, i));
    });

    originEl.classList.add('is-spider-origin');
    originEl.appendChild(overlay);
    this.spiderOrigin = originEl;
    this.spiderOverlay = overlay;

    this.openBackdrop();
    this.map.getContainer().classList.add('snap-spider-open');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        legs
          .querySelectorAll<SVGLineElement>('.snap-spider__leg')
          .forEach((line) => (line.style.strokeDashoffset = '0'));
      }),
    );
    this.spiderOpen = true;
  }

  private buildLeafElement(
    photoIndex: number,
    dx: number,
    dy: number,
    order: number,
  ): HTMLElement {
    const el = document.createElement('div');
    el.className = 'snap-leaf';
    el.style.setProperty('--tx', `${dx}px`);
    el.style.setProperty('--ty', `${dy}px`);
    el.style.transitionDelay = `${order * STAGGER_MS}ms`;
    el.appendChild(this.buildPin(this.geoPhotos[photoIndex].webviewPath));
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      this.collapseSpider();
      this.onSelect(this.geoPhotos, photoIndex);
    });
    return el;
  }

  private collapseSpider(): void {
    if (!this.spiderOpen && !this.spiderOverlay) {
      return;
    }
    this.spiderOverlay?.remove();
    this.spiderOverlay = undefined;
    this.spiderOrigin?.classList.remove('is-spider-origin');
    this.spiderOrigin = undefined;
    this.closeBackdrop();
    this.map?.getContainer().classList.remove('snap-spider-open');
    this.spiderOpen = false;
  }

  private openBackdrop(): void {
    if (!this.map) {
      return;
    }
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'snap-backdrop';
    this.backdrop.addEventListener('click', () => this.collapseSpider());
    this.map.getContainer().appendChild(this.backdrop);
  }

  private closeBackdrop(): void {
    this.backdrop?.remove();
    this.backdrop = undefined;
  }

  private buildPin(src: string): HTMLElement {
    const pin = document.createElement('div');
    pin.className = 'snap-pin';
    const img = document.createElement('img');
    img.className = 'snap-pin__img';
    img.src = src;
    pin.appendChild(img);
    return pin;
  }

  private fitToPhotos(): void {
    if (!this.map || this.fitted || this.geoPhotos.length === 0) {
      return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    for (const photo of this.geoPhotos) {
      bounds.extend([photo.longitude as number, photo.latitude as number]);
    }
    this.map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 0 });
    this.fitted = true;
  }

  private clearMarkers(): void {
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();
  }

  private addUserMarker(lng: number, lat: number): void {
    const el = document.createElement('div');
    el.className = 'snap-user';
    el.setAttribute('aria-label', 'Votre position');
    const halo = document.createElement('span');
    halo.className = 'snap-user__halo';
    const dot = document.createElement('span');
    dot.className = 'snap-user__dot';
    el.append(halo, dot);
    new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(this.map!);
  }
}
