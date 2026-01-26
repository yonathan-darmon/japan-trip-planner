import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="help-container">
      <div class="hero-section">
        <h1>Comment ça marche ?</h1>
        <p>
          Organiser votre voyage au Japon n'a jamais été aussi simple. 
          Suivez ces 4 étapes pour créer l'itinéraire parfait.
        </p>
      </div>

      <div class="steps-grid">
        <!-- Step 1 -->
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="icon-wrapper">🍯</div>
          <h3>Suggérer</h3>
          <p>
            Tout part du <span class="highlight">Pot Commun</span>. Ajoutez toutes vos envies : temples, restaurants, parcs d'attractions... 
            Ne vous souciez pas encore du planning, jetez juste vos idées !
          </p>
        </div>

        <!-- Step 2 -->
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="icon-wrapper">❤️</div>
          <h3>Voter</h3>
          <p>
            En groupe ou en solo, votez pour vos activités préférées. 
            L'algorithme priorisera les activités avec le plus de votes (<span class="highlight">Cœurs</span>).
          </p>
        </div>

        <!-- Step 3 -->
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="icon-wrapper">✨</div>
          <h3>Générer</h3>
          <p>
            C'est là que la magie opère. Notre algorithme analyse la géographie, les horaires et la durée pour créer un 
            <span class="highlight">planning optimisé</span> jour par jour.
          </p>
        </div>

        <!-- Step 4 -->
        <div class="step-card">
          <div class="step-number">4</div>
          <div class="icon-wrapper">🛠️</div>
          <h3>Ajuster</h3>
          <p>
            Le résultat ne vous convient pas à 100% ? Pas de problème. 
            Utilisez le <span class="highlight">Drag & Drop</span> pour déplacer des activités ou changer d'hôtel.
          </p>
        </div>
      </div>

      <div class="cta-section">
        <a routerLink="/suggestions" class="btn-cta">
          Commencer maintenant 🚀
        </a>
      </div>
    </div>
  `,
    styleUrls: ['./help.component.css']
})
export class HelpComponent { }
