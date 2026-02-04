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
          Organiser votre voyage n'a jamais été aussi simple. 
          Suivez ces étapes pour créer l'itinéraire parfait.
        </p>
      </div>

      <div class="steps-grid">
        <!-- Step 1 -->
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="icon-wrapper">👥</div>
          <h3>Groupe</h3>
          <p>
            Tout commence par un <span class="highlight">Groupe</span>. 
            Rejoignez-en un ou créez-le pour définir votre destination. Chaque groupe est isolé et sécurisé.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="icon-wrapper">⚙️</div>
          <h3>Configurer</h3>
          <p>
            L'administrateur du groupe définit la <span class="highlight">durée</span> et les dates du voyage via le Dashboard.
            C'est la base de votre itinéraire.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="icon-wrapper">🍯</div>
          <h3>Suggérer</h3>
          <p>
            Remplissez le <span class="highlight">Pot Commun</span> de votre groupe.
            Ajoutez toutes vos envies : temples, restaurants, parcs... Elles ne seront visibles que par vous.
          </p>
        </div>

        <!-- Step 4 -->
        <div class="step-card">
          <div class="step-number">4</div>
          <div class="icon-wrapper">❤️</div>
          <h3>Voter</h3>
          <p>
            Votez pour vos activités préférées. 
            L'algorithme priorisera les activités les plus populaires au sein du groupe.
          </p>
        </div>

        <!-- Step 5 -->
        <div class="step-card">
          <div class="step-number">5</div>
          <div class="icon-wrapper">✨</div>
          <h3>Générer & Ajuster</h3>
          <p>
            Générez un planning optimisé jour par jour, puis ajustez-le par <span class="highlight">Drag & Drop</span>
            pour qu'il soit parfait.
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
