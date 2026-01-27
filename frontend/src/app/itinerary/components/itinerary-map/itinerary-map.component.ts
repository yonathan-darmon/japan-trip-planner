import { Component, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { Itinerary, ItineraryDay } from '../../../core/services/itinerary';
import { Suggestion, SuggestionCategory } from '../../../core/services/suggestions';

@Component({
    selector: 'app-itinerary-map',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="map-container">
      <div id="map"></div>
    </div>
  `,
    styles: [`
    .map-container {
      height: 100%;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    #map {
      height: 100%;
      width: 100%;
    }
  `]
})
export class ItineraryMapComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() itinerary: Itinerary | null = null;
    @Input() selectedDay: ItineraryDay | null = null;

    private map: L.Map | null = null;
    private markersLayer: L.LayerGroup | null = null;

    // Custom Icons
    private categoryIcons: { [key: string]: L.Icon } = {
        [SuggestionCategory.HEBERGEMENT]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3009/3009489.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        }),
        [SuggestionCategory.RESTAURANT]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        }),
        [SuggestionCategory.ACTIVITE]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2907/2907253.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        }),
        [SuggestionCategory.TRANSPORT]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/723/723955.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        }),
        [SuggestionCategory.SHOPPING]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2331/2331970.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        }),
        [SuggestionCategory.AUTRE]: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2879/2879192.png',
            iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
        })
    };

    private defaultIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.initMap();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['itinerary'] || changes['selectedDay']) {
            this.updateMapLayers();
        }
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    private initMap(): void {
        if (this.map) return;

        this.map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([35.6762, 139.6503], 13); // Tokyo default

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);
        this.updateMapLayers();
    }

    private updateMapLayers(): void {
        if (!this.map || !this.markersLayer || !this.itinerary) return;

        this.markersLayer.clearLayers();
        const bounds = L.latLngBounds([]);

        // 1. Plot ALL markers for ALL days
        this.itinerary.days.forEach(day => {
            const isDaySelected = !this.selectedDay || this.selectedDay.dayNumber === day.dayNumber;

            // Activities
            day.activities.forEach(act => {
                const lat = Number(act.suggestion.latitude);
                const lng = Number(act.suggestion.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    // Add all markers, but maybe make them more subtle if they aren't in selected day?
                    this.addMarker(
                        act.suggestion,
                        isDaySelected ? bounds : null, // Only extend bounds if selected or no selection
                        `J${day.dayNumber}: ${act.suggestion.name}`
                    );
                }
            });

            // Accommodation
            if (day.accommodation) {
                this.addMarker(
                    day.accommodation,
                    isDaySelected ? bounds : null,
                    `Hôtel J${day.dayNumber}: ${day.accommodation.name}`
                );
            }
        });

        // 2. Draw Polyline (Path)
        if (this.selectedDay) {
            // SINGLE DAY VIEW: High contrast path for selected day
            const dayCoords: L.LatLngExpression[] = this.selectedDay.activities
                .map(act => {
                    const lat = Number(act.suggestion.latitude);
                    const lng = Number(act.suggestion.longitude);
                    return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] as L.LatLngExpression : null;
                })
                .filter(c => c !== null) as L.LatLngExpression[];

            if (dayCoords.length > 1 && this.markersLayer) {
                L.polyline(dayCoords, {
                    color: '#63b3ed',
                    weight: 5,
                    opacity: 0.9,
                    lineJoin: 'round',
                    lineCap: 'round'
                }).addTo(this.markersLayer);
            }
        } else {
            // GLOBAL VIEW: One continuous path across all days
            const allCoords: L.LatLngExpression[] = [];
            this.itinerary.days.forEach(day => {
                const sortedActs = [...day.activities].sort((a, b) => a.orderInDay - b.orderInDay);
                sortedActs.forEach(act => {
                    const lat = Number(act.suggestion.latitude);
                    const lng = Number(act.suggestion.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        allCoords.push([lat, lng]);
                    }
                });
            });

            if (allCoords.length > 1 && this.markersLayer) {
                L.polyline(allCoords, {
                    color: '#718096',
                    weight: 3,
                    opacity: 0.5,
                    lineJoin: 'round',
                    lineCap: 'round'
                }).addTo(this.markersLayer);
            }
        }

        // 3. Adjust View
        if (bounds.isValid()) {
            this.map.fitBounds(bounds.pad(0.1), { animate: true });
        }
    }

    private addMarker(suggestion: Suggestion, bounds: L.LatLngBounds | null, popupText: string) {
        if (!suggestion.latitude || !suggestion.longitude || !this.markersLayer) return;

        const lat = Number(suggestion.latitude);
        const lng = Number(suggestion.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const category = suggestion.category || SuggestionCategory.AUTRE;
        const icon = this.categoryIcons[category] || this.defaultIcon;

        const marker = L.marker([lat, lng], { icon })
            .bindPopup(`<b>${popupText}</b><br>${category}`)
            .addTo(this.markersLayer);

        // If no day is selected, we want all markers visible in bounds
        // If a day is selected, we only want those in bounds
        if (bounds) {
            bounds.extend([lat, lng]);
        }
    }
}
