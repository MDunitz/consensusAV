// Consensus Disagreement Application
// Main application logic

// Application state
let consensusData = [];
let currentIssue = null;

// Configuration
const CONFIG = {
    csvFile: 'consensus_data.csv',
    colors: {
        science: '#4a9eff',
        public: '#ff6b6b',
        disagree: 'rgba(255,255,255,0.1)',
        border: 'rgba(255,255,255,0.1)',
        background: '#0a0a0f'
    }
};

// CSV Parser
class CSVParser {
    static parse(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
            const values = this.parseLine(line);
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] ? values[i].replace(/^"|"$/g, '') : '';
            });
            return obj;
        });
    }

    static parseLine(line) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let char of line) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        return values;
    }
}

// Data Loader
class DataLoader {
    static async loadCSV(filepath) {
        try {
            const response = await fetch(filepath);
            const csvText = await response.text();
            return CSVParser.parse(csvText);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
}

// UI Controller
class UIController {
    static populateSelector(data) {
        const select = document.getElementById('issue-select');
        select.innerHTML = '<option value="">-- Select an Issue --</option>';

        data.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.issue;
            select.appendChild(option);
        });
    }

    static updateDisplay(issue) {
        this.updateStatement(issue);
        this.updatePercentages(issue);
        this.updateInfoCards(issue);
        ChartRenderer.drawPieCharts(issue);
    }

    static updateStatement(issue) {
        document.getElementById('statement-text').textContent = issue.statement;
    }

    static updatePercentages(issue) {
        const sciencePercent = parseFloat(issue.scientific_consensus);
        const publicPercent = parseFloat(issue.public_agreement);

        document.getElementById('science-percent').textContent = `${sciencePercent.toFixed(1)}%`;
        document.getElementById('public-percent').textContent = `${publicPercent.toFixed(1)}%`;
    }

    static updateInfoCards(issue) {
        const gap = parseFloat(issue.scientific_consensus) - parseFloat(issue.public_agreement);
        document.getElementById('gap-value').textContent = `${gap.toFixed(1)} percentage points`;
        document.getElementById('state-variation').textContent = issue.state_variation;
        this.updateCitations(issue);
    }

    static updateCitations(issue) {
        const citationsList = document.getElementById('citations-list');
        const sources = issue.sources.split(';').map(s => s.trim());

        citationsList.innerHTML = sources.map(source => {
            const link = this.getSourceLink(source);
            if (link) {
                return `<div class="citation-item"><a href="${link}" target="_blank" rel="noopener noreferrer">${source}</a></div>`;
            } else {
                return `<div class="citation-item">${source}</div>`;
            }
        }).join('');
    }

    static getSourceLink(source) {
        const lowerSource = source.toLowerCase();

        // Map common sources to their websites
        if (lowerSource.includes('pew research')) {
            return 'https://www.pewresearch.org/';
        }
        if (lowerSource.includes('cdc')) {
            return 'https://www.cdc.gov/';
        }
        if (lowerSource.includes('gallup')) {
            return 'https://www.gallup.com/';
        }
        if (lowerSource.includes('kaiser family foundation')) {
            return 'https://www.kff.org/';
        }
        if (lowerSource.includes('national academies')) {
            return 'https://www.nationalacademies.org/';
        }
        if (lowerSource.includes('ipcc')) {
            return 'https://www.ipcc.ch/';
        }
        if (lowerSource.includes('who')) {
            return 'https://www.who.int/';
        }
        if (lowerSource.includes('ada') && lowerSource.includes('2023')) {
            return 'https://www.ada.org/';
        }
        if (lowerSource.includes('aaas')) {
            return 'https://www.aaas.org/';
        }
        if (lowerSource.includes('institute of medicine')) {
            return 'https://www.nationalacademies.org/iom';
        }
        if (lowerSource.includes('icnirp')) {
            return 'https://www.icnirp.org/';
        }
        if (lowerSource.includes('cochrane')) {
            return 'https://www.cochrane.org/';
        }

        // For academic papers, try to construct DOI search links
        if (lowerSource.includes('myers et al') && lowerSource.includes('2021')) {
            return 'https://doi.org/10.1088/1748-9326/ac2966';
        }

        return null;
    }

    static showError(message) {
        const select = document.getElementById('issue-select');
        select.innerHTML = `<option value="">${message}</option>`;
    }
}

// Chart Renderer
class ChartRenderer {
    static drawPieCharts(issue) {
        const sciencePercent = parseFloat(issue.scientific_consensus);
        const publicPercent = parseFloat(issue.public_agreement);

        const chartDiv = document.getElementById('chart');
        chartDiv.innerHTML = `
            <div style="display: flex; gap: 2rem; justify-content: center; align-items: center;">
                ${this.createPieChart('Scientific', sciencePercent, CONFIG.colors.science)}
                ${this.createPieChart('Public', publicPercent, CONFIG.colors.public)}
            </div>
        `;
    }

    static createPieChart(label, percentage, color) {
        const circumference = 2 * Math.PI * 80; // radius = 80
        const dashArray = (percentage / 100) * circumference;
        const dashOffset = circumference;

        return `
            <div style="text-align: center;">
                <div style="margin-bottom: 0.75rem; color: ${color}; font-weight: 600; font-size: 1.1rem;">${label}</div>
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <!-- Background circle -->
                    <circle cx="100" cy="100" r="90" fill="none" stroke="${CONFIG.colors.border}" stroke-width="2"/>

                    <!-- Disagree portion (background) -->
                    <circle cx="100" cy="100" r="80" fill="none"
                            stroke="${CONFIG.colors.disagree}" stroke-width="80"/>

                    <!-- Agree portion -->
                    <circle cx="100" cy="100" r="80" fill="none"
                            stroke="${color}" stroke-width="80"
                            stroke-dasharray="${dashArray} ${dashOffset}"
                            transform="rotate(-90 100 100)"
                            opacity="0.9"/>

                    <!-- Center circle -->
                    <circle cx="100" cy="100" r="40" fill="${CONFIG.colors.background}"/>

                    <!-- Percentage text -->
                    <text x="100" y="105" text-anchor="middle" fill="${color}"
                          font-size="28" font-weight="600">
                        ${percentage.toFixed(1)}%
                    </text>
                </svg>
            </div>
        `;
    }
}

// Audio Controller - plays pre-generated audio files
class AudioController {
    constructor() {
        this.visualizationInterval = null;
        this.isPlaying = false;
        this.currentAudio = null;
        this.currentButton = null;
    }

    async playAudio(perspective, type) {
        if (this.isPlaying || !currentIssue) return;

        const issueIndex = consensusData.indexOf(currentIssue);
        const prefix = `${issueIndex.toString().padStart(2, '0')}`;
        const filepath = `audio/${prefix}_${perspective}_${type}.mp3`;

        // Get button and label
        const buttonId = `${perspective}-${type}-btn`;
        const button = document.getElementById(buttonId);
        const label = document.getElementById('playing-label');
        const visualization = document.getElementById('audio-visualization');

        this.isPlaying = true;
        this.currentButton = button;
        button.classList.add('playing');
        visualization.classList.add('active');
        this.animateVisualization();

        // Update label
        const perspectiveName = perspective === 'sci' ? 'SCIENTIFIC CONSENSUS' : 'PUBLIC OPINION';
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        const color = perspective === 'sci' ? CONFIG.colors.science : CONFIG.colors.public;
        this.updateLabel(label, `${perspectiveName} - ${typeName}`, color);

        try {
            await this.playAudioFile(filepath);
        } catch (error) {
            console.error('Error playing audio:', error);
            alert('Audio files not found. Please run "make audio" to generate them.');
        } finally {
            this.stopPlayback(visualization, label);
        }
    }

    updateLabel(element, text, color) {
        element.textContent = text;
        element.style.color = color;
    }

    playAudioFile(filepath) {
        return new Promise((resolve, reject) => {
            this.currentAudio = new Audio(filepath);

            this.currentAudio.onended = () => {
                resolve();
            };

            this.currentAudio.onerror = () => {
                reject(new Error(`Failed to load audio: ${filepath}`));
            };

            this.currentAudio.play().catch(reject);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    animateVisualization() {
        const bars = document.querySelectorAll('.audio-bar');

        this.visualizationInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = 20 + Math.random() * 60;
                bar.style.height = `${height}px`;
            });
        }, 100);
    }

    stopVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval);
        }
        const bars = document.querySelectorAll('.audio-bar');
        bars.forEach(bar => {
            bar.style.height = '20px';
        });
    }

    stopPlayback(visualization, label) {
        this.isPlaying = false;
        if (this.currentButton) {
            this.currentButton.classList.remove('playing');
        }
        visualization.classList.remove('active');
        this.stopVisualization();
        label.textContent = 'Click a button to play audio';
        label.style.color = 'var(--text-secondary)';
    }
}

// Application Controller
class App {
    constructor() {
        this.audioController = new AudioController();
    }

    async initialize() {
        try {
            consensusData = await DataLoader.loadCSV(CONFIG.csvFile);
            UIController.populateSelector(consensusData);
            this.setupEventListeners();
            this.loadVoices();
        } catch (error) {
            UIController.showError('Error loading data');
        }
    }

    setupEventListeners() {
        // Issue selector
        document.getElementById('issue-select').addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.selectIssue(parseInt(e.target.value));
            }
        });

        // Audio buttons
        document.getElementById('sci-agree-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('sci', 'agree');
        });

        document.getElementById('sci-disagree-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('sci', 'disagree');
        });

        document.getElementById('sci-both-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('sci', 'both');
        });

        document.getElementById('pub-agree-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('pub', 'agree');
        });

        document.getElementById('pub-disagree-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('pub', 'disagree');
        });

        document.getElementById('pub-both-btn').addEventListener('click', () => {
            if (currentIssue) this.audioController.playAudio('pub', 'both');
        });
    }

    enableAudioButtons() {
        const buttons = [
            'sci-agree-btn', 'sci-disagree-btn', 'sci-both-btn',
            'pub-agree-btn', 'pub-disagree-btn', 'pub-both-btn'
        ];
        buttons.forEach(id => {
            document.getElementById(id).disabled = false;
        });
    }

    selectIssue(index) {
        currentIssue = consensusData[index];
        UIController.updateDisplay(currentIssue);
        this.enableAudioButtons();
        document.getElementById('playing-label').textContent = 'Click a button to play audio';
    }

    loadVoices() {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                speechSynthesis.getVoices();
            };
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});
