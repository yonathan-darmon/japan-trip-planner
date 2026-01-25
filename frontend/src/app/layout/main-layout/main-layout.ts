import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent { }
