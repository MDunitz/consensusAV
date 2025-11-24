# Consensus Disagreement Visualization

An interactive web application that visualizes the gap between scientific consensus and public opinion on various issues through audio and visual representations.

## Features

- **Visual Comparison**: Side-by-side pie charts showing scientific consensus vs public opinion
- **Audio Representation**: Hear the disagreement through mixed voices at proportional volumes
- **Multiple Issues**: Compare consensus on climate change, vaccines, evolution, GMOs, and more

## Setup

### Prerequisites

1. **Python 3** (for audio generation and web server)
2. **ffmpeg** (for audio processing)

Install ffmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

### Installation

1. Install Python dependencies:
```bash
make install
```

2. Generate audio files:
```bash
make audio
```

This will create mixed audio files in the `audio/` directory. Each issue gets 6 audio files:
- `XX_sci_agree.mp3` - Scientific "I believe" voice
- `XX_sci_disagree.mp3` - Scientific "I don't believe" voice
- `XX_sci_both.mp3` - Both voices mixed simultaneously
- `XX_pub_agree.mp3` - Public "I believe" voice
- `XX_pub_disagree.mp3` - Public "I don't believe" voice
- `XX_pub_both.mp3` - Both voices mixed simultaneously

3. Run the application:
```bash
make open
```

This will start a local web server and open the app in your browser.

## Usage

```bash
make help       # Show all available commands
make install    # Install dependencies
make audio      # Generate audio files
make run        # Start web server
make open       # Start server and open in browser
make stop       # Stop the web server
make clean      # Clean up temporary files
```

## How It Works

### Audio Generation

The Python script (`generate_audio.py`):
1. Reads consensus data from `consensus_data.csv`
2. Generates TTS audio for "I believe [statement]" and "I don't believe [statement]"
3. Adjusts volume levels based on consensus percentages
4. Mixes audio tracks using proper audio processing (not just queuing)
5. Exports final MP3 files

The mixing uses logarithmic volume scaling (dB) for accurate perception:
- 100% agreement = 0dB (full volume)
- 50% agreement = -6dB (half perceived loudness)
- Volume adjustment: `20 * log10(percentage)`

### Web Application

- **HTML**: Layout and structure
- **JavaScript**: Application logic, data loading, visualization
- **CSS**: Styling (embedded in HTML)
- **Data**: CSV file with consensus percentages

## File Structure

```
consensus_av/
├── consensus_disagreement_app.html  # Main HTML file
├── app.js                           # JavaScript application logic
├── consensus_data.csv               # Consensus data
├── generate_audio.py                # Audio generation script
├── requirements.txt                 # Python dependencies
├── Makefile                         # Build and run commands
├── README.md                        # This file
├── audio/                           # Generated audio files (created by make audio)
│   ├── 00_sci_agree.mp3
│   ├── 00_sci_disagree.mp3
│   ├── 00_sci_both.mp3
│   └── ...
└── audio/temp/                      # Temporary TTS files
```

## Data Sources

The consensus data includes percentages from peer-reviewed research and public opinion polls:

- Scientific consensus from academic surveys and meta-analyses
- Public opinion from Pew Research, Gallup, and other reputable polling organizations

See the `sources` column in `consensus_data.csv` for specific citations.

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Audio Generation**: Python (gtts, pydub, numpy)
- **Audio Processing**: ffmpeg
- **Web Server**: Python HTTP server

## License

This project is for educational purposes.
