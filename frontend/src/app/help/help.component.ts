import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="help-container">

      <!-- HERO -->
      <div class="hero-section">
        <h1>Comment ça marche ?</h1>
        <p>
          Planifier un voyage en groupe n'a jamais été aussi simple.
          Suivez ces étapes et consultez la FAQ si vous avez des questions.
        </p>
        <div class="hero-links">
          <a href="#steps" class="btn-cta">Voir les étapes ↓</a>
          <a href="#faq" class="btn-outline-small">FAQ ↓</a>
        </div>
      </div>

      <!-- STEPS -->
      <section id="steps">
        <div class="steps-grid">

          <div class="step-card">
            <div class="step-number">1</div>
            <div class="icon-wrapper">👥</div>
            <h3>Rejoindre un Groupe</h3>
            <p>
              Tout commence par un <span class="highlight">Groupe</span>.
              Un administrateur crée le groupe et choisit la destination (ex. Japon).
              Chaque groupe est isolé : vos données sont privées.
            </p>
            <a routerLink="/groups" class="step-link">→ Mes groupes</a>
          </div>

          <div class="step-card">
            <div class="step-number">2</div>
            <div class="icon-wrapper">⚙️</div>
            <h3>Configurer le voyage</h3>
            <p>
              L'administrateur définit la <span class="highlight">durée</span> du voyage
              (ex. 21 jours) et la date de départ depuis le Dashboard.
              Ces paramètres servent de base à l'algorithme de planification.
            </p>
            <a routerLink="/dashboard" class="step-link">→ Dashboard</a>
          </div>

          <div class="step-card">
            <div class="step-number">3</div>
            <div class="icon-wrapper">🍯</div>
            <h3>Suggérer des activités</h3>
            <p>
              Chaque membre ajoute ses envies dans le <span class="highlight">Pot Commun</span>
              du groupe : temples, restaurants, musées, randonnées…
              Par défaut, vos suggestions ne sont visibles que par vous (mode privé).
              Rendez-les publiques pour que le groupe les voie.
            </p>
            <a routerLink="/suggestions/new" class="step-link">→ Ajouter une suggestion</a>
          </div>

          <div class="step-card">
            <div class="step-number">4</div>
            <div class="icon-wrapper">❤️</div>
            <h3>Voter pour vos favoris</h3>
            <p>
              Parcourez les suggestions <span class="highlight">publiques</span> du groupe
              et votez pour celles que vous voulez vraiment faire.
              L'algorithme de génération priorisera les activités les plus
              populaires parmi tous les membres.
            </p>
            <a routerLink="/suggestions" class="step-link">→ Voir & voter</a>
          </div>

          <div class="step-card">
            <div class="step-number">5</div>
            <div class="icon-wrapper">✨</div>
            <h3>Générer & Ajuster</h3>
            <p>
              Cliquez sur <strong>Planifier</strong> depuis le Dashboard pour générer
              un itinéraire optimisé jour par jour.
              Ensuite, personnalisez-le : réorganisez les activités par
              <span class="highlight">Drag & Drop</span>, supprimez ou ajoutez des étapes
              selon vos envies.
            </p>
            <a routerLink="/dashboard" class="step-link">→ Générer un itinéraire</a>
          </div>

        </div>
      </section>

      <!-- ROLES SECTION -->
      <section id="roles" class="info-section">
        <h2>🎭 Les rôles dans un groupe</h2>
        <div class="roles-grid">
          <div class="role-card">
            <div class="role-icon">👤</div>
            <h4>Participant</h4>
            <ul>
              <li>Ajouter et gérer ses propres suggestions</li>
              <li>Voter pour les suggestions publiques</li>
              <li>Voir les itinéraires générés du groupe</li>
            </ul>
          </div>
          <div class="role-card featured">
            <div class="role-icon">👑</div>
            <h4>Admin du groupe</h4>
            <ul>
              <li>Tout ce qu'un participant peut faire</li>
              <li>Inviter de nouveaux membres</li>
              <li>Configurer la durée et les dates du voyage</li>
              <li>Gérer les membres du groupe</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="faq-section">
        <h2>❓ Questions fréquentes</h2>
        <div class="faq-list">
          <div
            class="faq-item"
            *ngFor="let item of faqItems"
            [class.open]="item.open"
            (click)="item.open = !item.open">
            <div class="faq-question">
              <span>{{ item.question }}</span>
              <span class="faq-chevron">{{ item.open ? '▲' : '▼' }}</span>
            </div>
            <div class="faq-answer" *ngIf="item.open">
              {{ item.answer }}
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <div class="cta-section">
        <h3>Prêt à commencer ?</h3>
        <div class="cta-buttons">
          <a routerLink="/groups" class="btn-cta">👥 Mes groupes</a>
          <a routerLink="/suggestions/new" class="btn-cta secondary">⛩️ Ajouter une suggestion</a>
          <a routerLink="/dashboard" class="btn-outline-small">🏠 Dashboard</a>
        </div>
      </div>

    </div>
  `,
  styleUrls: ['./help.component.css']
})
export class HelpComponent {
  faqItems: FaqItem[] = [
    {
      question: 'Quelle est la différence entre une suggestion privée et publique ?',
      answer: 'Une suggestion privée n\'est visible que par vous. En mode public, tous les membres de votre groupe peuvent la voir et voter pour elle. Par défaut les suggestions sont privées pour vous laisser le temps de les peaufiner avant de les partager.',
      open: false
    },
    {
      question: 'Comment fonctionne le système de votes ?',
      answer: 'Chaque membre peut voter (❤️) pour les suggestions publiques du groupe. L\'algorithme de génération d\'itinéraire priorise les suggestions avec le plus grand nombre de votes, en tenant compte de la géographie pour limiter les déplacements.',
      open: false
    },
    {
      question: 'Comment l\'itinéraire est-il généré ?',
      answer: 'L\'algorithme prend en compte : la durée du voyage configurée, le nombre de votes de chaque suggestion, la localisation géographique des activités (pour minimiser les trajets), et un quota d\'activités par jour. Il génère ensuite un planning optimisé jour par jour.',
      open: false
    },
    {
      question: 'Puis-je modifier un itinéraire généré ?',
      answer: 'Oui ! Après génération, vous pouvez réorganiser les activités par Drag & Drop entre les jours, supprimer des activités que vous ne voulez pas, ou ajuster l\'ordre au sein d\'une même journée. Le coût et le temps de trajet se recalculent automatiquement.',
      open: false
    },
    {
      question: 'Que fait le Drag & Drop dans l\'itinéraire ?',
      answer: 'Dans l\'écran de visualisation de l\'itinéraire, vous pouvez glisser-déposer une activité d\'un jour vers un autre, ou changer son ordre dans la même journée. L\'algorithme recalcule en temps réel le temps de marche et la charge de chaque journée.',
      open: false
    },
    {
      question: 'Puis-je générer plusieurs itinéraires pour le même groupe ?',
      answer: 'Oui, vous pouvez générer autant d\'itinéraires que vous voulez. Chaque génération crée un nouveau planning basé sur les votes actuels. Ils sont tous accessibles depuis le Dashboard et depuis la section Itinéraires.',
      open: false
    },
    {
      question: 'Comment inviter quelqu\'un dans mon groupe ?',
      answer: 'Si vous êtes administrateur du groupe, allez dans le Dashboard puis cliquez sur "Membres / Inviter". Vous aurez accès à un lien ou un code d\'invitation à partager avec vos co-voyageurs.',
      open: false
    },
    {
      question: 'Mes suggestions sont-elles visibles par d\'autres groupes ?',
      answer: 'Non. Chaque groupe est totalement isolé. Même si vous appartenez à plusieurs groupes, les suggestions, votes et itinéraires sont strictement cloisonnés par groupe.',
      open: false
    }
  ];
}
