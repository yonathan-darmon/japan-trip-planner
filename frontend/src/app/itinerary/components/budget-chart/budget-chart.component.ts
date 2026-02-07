import { Component, Input, OnChanges, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface BudgetData {
  dailyTotals: { dayNumber: number; date: Date | null; totalEur: number }[];
  totalEur: number;
  currencySymbol: string;
}

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="budget-container" *ngIf="budgetData">
      <div class="budget-header">
        <h3>💰 Budget du Voyage</h3>
        <div class="total-budget">
          <span class="label">Total</span>
          <span class="amount">{{ budgetData.totalEur | number:'1.0-0' }} {{ budgetData.currencySymbol }}</span>
        </div>
      </div>
      
      <div class="chart-wrapper">
        <canvas #budgetChart></canvas>
      </div>
      
      <div class="empty-state" *ngIf="budgetData.totalEur === 0">
        <p>Aucune dépense enregistrée pour ce voyage</p>
        <small>Ajoutez des prix aux activités pour voir le budget</small>
      </div>
    </div>
  `,
  styles: [`
    .budget-container {
      background: #2d3748;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .budget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #4a5568;
    }

    .budget-header h3 {
      margin: 0;
      color: #f7fafc;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .total-budget {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .total-budget .label {
      font-size: 0.75rem;
      color: #a0aec0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .total-budget .amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #68d391;
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
      margin-bottom: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #a0aec0;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 1rem;
      color: #cbd5e0;
    }

    .empty-state small {
      font-size: 0.85rem;
      color: #718096;
    }

    @media (max-width: 768px) {
      .budget-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .total-budget {
        align-items: flex-start;
      }

      .chart-wrapper {
        height: 250px;
      }
    }
  `]
})
export class BudgetChartComponent implements OnChanges, OnDestroy {
  @Input() budgetData: BudgetData | null = null;

  private _chartCanvas: ElementRef<HTMLCanvasElement> | undefined;
  private chart: Chart | null = null;

  @ViewChild('budgetChart')
  set chartCanvas(value: ElementRef<HTMLCanvasElement> | undefined) {
    this._chartCanvas = value;
    if (value) {
      this.createChart();
    }
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['budgetData'] && this.budgetData) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!isPlatformBrowser(this.platformId) || !this._chartCanvas || !this.budgetData) {
      return;
    }

    if (this.budgetData.totalEur <= 0 && this.chart) {
      this.chart.destroy();
      this.chart = null;
      return;
    }

    if (this.budgetData.totalEur <= 0) return;

    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this._chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // Prepare data
    const labels = this.budgetData.dailyTotals.map(d => `Jour ${d.dayNumber}`);
    const data = this.budgetData.dailyTotals.map(d => d.totalEur);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Budget par jour (€)',
          data,
          backgroundColor: 'rgba(104, 211, 145, 0.8)', // Green
          borderColor: 'rgba(104, 211, 145, 1)',
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1a202c',
            titleColor: '#f7fafc',
            bodyColor: '#cbd5e0',
            borderColor: '#4a5568',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                return `${context.parsed.y.toFixed(0)} ${this.budgetData?.currencySymbol || '€'}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#a0aec0',
              callback: function (value) {
                return value + ' €';
              }
            },
            grid: {
              color: '#4a5568',
            }
          },
          x: {
            ticks: {
              color: '#a0aec0',
            },
            grid: {
              display: false,
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
