import { Component, OnInit } from '@angular/core';
import * as Leaflet from 'leaflet';

import * as data from '../../assets/data.json';
import { cloneDeep } from 'lodash';
import { IconstructionData } from './model/constructionData.model';
import { IvehicleData } from './model/vehicleData.model';
import { Ivehicle } from './model/vehicle.model';

@Component({
  selector: 'app-gis',
  templateUrl: './gis.component.html',
  styleUrls: ['./gis.component.scss'],
})
export class GisComponent implements OnInit {
  private lat: number;
  private lng: number;
  private rad = 1000;
  public ilatLng: any;
  private circle: any;
  private marker: any;
  private map: any;
  private excavatorIcon;
  public excavators: Ivehicle[] = [];
  public trucks: Ivehicle[] = [];
  public vehicleListDetails: IvehicleData;
  private truckIcon;
  public tabSelect = true;
  private customMarker = [];
  public vehicleDetails: IvehicleData[] = [];
  public siteDetails: IconstructionData;
  public timeRange = 0;
  private count = 0;
  public todayDate = new Date();
  public selectedData = new Date();
  public siteNames: any[] = [];
  constructionDetails: IconstructionData[] = (data as any).default;

  constructor() {}

  public ngOnInit() {
    // loading Custom Icons for maps

    this.excavatorIcon = Leaflet.icon({
      iconUrl: './../../assets/excavator.png',
      iconSize: [38, 40],
    });
    this.truckIcon = Leaflet.icon({
      iconUrl: './../../assets/truck.png',
      iconSize: [40, 30],
    });

    this.constructionDetails.filter((site) => {
      if (site.constructionArea !== '') {
        this.siteNames.push(site.constructionArea);
      }
    });
  }

  onSelectSiteName(event) {
    this.excavators = [];
    this.trucks = [];
    const selectedValue = event.target.value;
    // getting the co-ordinates as per selected Site Name;
    const constructionDetails: IconstructionData[] = cloneDeep(
      this.constructionDetails
    );
    const siteDetail: IconstructionData = constructionDetails.find((site) => {
      if (site.constructionArea === selectedValue) {
        this.lat = site.latitude;
        this.lng = site.longitude;
        this.count += 1;
        return site;
      }
    });
    this.siteDetails = siteDetail;
    if (this.siteDetails) {
      this.loadingMap();
      this.selectedDateFilter();
    }
  }

  selectedDateFilter() {
    const siteDetail = cloneDeep(this.siteDetails);
    const vehicleDetails: IvehicleData[] = siteDetail.vehicleData.filter(
      (data) => {
        const date = new Date(data.date).toLocaleDateString();
        if (date === this.selectedData.toLocaleDateString()) {
          return data;
        }
      }
    );
    this.vehicleDetails = vehicleDetails;
    if (vehicleDetails) {
      this.updateDateTime(vehicleDetails);
      const vehicleListDetails: IvehicleData = vehicleDetails.find((data) => {
        const hourtime = new Date(data.date).getHours();
        if (hourtime === this.timeRange) {
          return data;
        }
      });

      this.vehicleListDetails = vehicleListDetails;
      if (this.vehicleListDetails) {
        this.vehicleListDetails['vehicle'].forEach((data) => {
          if (data.vehicleType === 'Excavator') {
            this.excavators.push(data);
          } else if (data.vehicleType === 'Truck') {
            this.trucks.push(data);
          }
        });
        this.addNewVehicleMarker();
      } else {
        if (this.customMarker.length > 0) {
          this.customMarker.forEach((e) => this.map.removeLayer(e));
        }
      }
    }
  }

  addNewVehicleMarker() {
    this.excavators.forEach((data) => {
      this.customMarker.push(
        Leaflet.marker([data.latitude, data.longitude], {
          icon: this.excavatorIcon,
        }).addTo(this.map)
      );
    });
    this.trucks.forEach((data) => {
      this.customMarker.push(
        Leaflet.marker([data.latitude, data.longitude], {
          icon: this.truckIcon,
        }).addTo(this.map)
      );
    });
  }

  updateDateTime(vehicleDetails: IvehicleData[]) {
    vehicleDetails.map((data) => {
      data.vehicle.map((Datetime) => {
        Datetime.time = new Date(data.date).toLocaleTimeString();
        Datetime.date = new Date(data.date).toLocaleDateString();
      });
    });
    this.vehicleDetails = vehicleDetails;
  }

  // loading initial map

  loadingMap() {
    this.ilatLng = Leaflet.latLng(this.lat, this.lng);
    if (this.count === 1) {
      setTimeout(this.loadMap.bind(this), 100);
    } else {
      this.map.removeLayer(this.marker);
      this.map.removeLayer(this.circle);
      this.marker = Leaflet.marker(this.latLng, { draggable: false }).addTo(
        this.map
      );
      this.circle = Leaflet.circle(this.latLng, this.radius).addTo(this.map);

      // Loading Map
      this.map.panTo(new Leaflet.LatLng(this.lat, this.lng));
    }
  }

  onHandleDateRedution() {
    const date = new Date(this.selectedData);
    date.setDate(date.getDate() - 1);
    this.selectedData = date;
    this.selectedDateFilter();
  }

  onHandleDateIncreament() {
    const date = new Date(this.selectedData);
    date.setDate(date.getDate() + 1);
    this.selectedData = date;
    this.selectedDateFilter();
  }

  onHandleChangingTimeRange() {
    this.vehicleDetails = null;
    this.excavators = [];
    this.trucks = [];
    this.selectedDateFilter();
  }

  onHandleMapviewClick() {
    this.tabSelect = true;
  }

  onHandleDocumentviewClick() {
    this.tabSelect = false;
  }

  get radius() {
    return this.rad;
  }

  set radius(value) {
    this.rad = value;
    this.circle.setRadius(value);
  }

  set latLng(value) {
    this.ilatLng = value;
    this.circle.setLatLng(value);
    this.marker.setLatLng(value);
  }

  get latLng() {
    return this.ilatLng;
  }

  loadMap() {
    this.map = Leaflet.map('map').setView(this.latLng, 15);

    Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ).addTo(this.map);

    this.marker = Leaflet.marker(this.latLng, { draggable: false }).addTo(
      this.map
    );

    this.circle = Leaflet.circle(this.latLng, this.radius).addTo(this.map);
  }
}
