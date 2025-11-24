#!/usr/bin/env python3
"""
Generate audio files for consensus disagreement visualization.
Creates audio with multiple voice instances speaking together - crowd simulation.
"""

import csv
from pathlib import Path
import random

from gtts import gTTS
from pydub import AudioSegment

# Configuration
CSV_FILE = 'consensus_data.csv'
AUDIO_DIR = 'audio'
TEMP_DIR = 'audio/temp'
NUM_VOICES = 100  # Total number of simulated voices

# Available gTTS voice variants (TLD variations)
VOICE_VARIANTS = [
    'com',      # US English
    'co.uk',    # UK English
    'com.au',   # Australian English
    'co.in',    # Indian English
    'ca',       # Canadian English
]

def ensure_directories():
    """Create audio directories if they don't exist."""
    Path(AUDIO_DIR).mkdir(exist_ok=True)
    Path(TEMP_DIR).mkdir(exist_ok=True)

def load_csv_data():
    """Load consensus data from CSV file."""
    data = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def generate_tts(text, filename, voice_type='com'):
    """Generate text-to-speech audio file with specified voice."""
    try:
        tts = gTTS(text=text, lang='en', tld=voice_type, slow=False)
        tts.save(filename)
        return True
    except Exception as e:
        print(f"  Error generating TTS: {e}")
        return False

def add_slight_variation(audio, variation_ms=50):
    """
    Add slight timing variation to make voices more natural.
    Adds random padding before the audio.
    """
    padding = random.randint(0, variation_ms)
    silence = AudioSegment.silent(duration=padding)
    return silence + audio

def create_crowd_audio(base_audio, num_copies, add_variation=True):
    """
    Create a crowd effect by layering multiple copies of the same audio.
    Uses proper acoustic scaling: doubling people = +3dB

    For incoherent sources (people speaking slightly out of sync):
    - Sound intensity adds linearly
    - Each doubling of sources adds ~3dB
    - Formula: dB increase = 10 * log10(N) where N is number of sources
    """
    if num_copies == 0:
        return AudioSegment.silent(duration=len(base_audio))

    if num_copies == 1:
        return add_slight_variation(base_audio, 30) if add_variation else base_audio

    # For realistic crowd sound, we don't need to layer 1000 copies
    # Instead, layer a reasonable number and adjust the volume
    # Use square root scaling for number of actual layers (diminishing returns)
    num_layers = min(int(num_copies ** 0.5), 50)  # Cap at 50 layers for performance

    # Calculate the volume boost based on the ACTUAL crowd size
    # 10 * log10(N) gives us the dB increase for N incoherent sources
    import math
    db_increase = 10 * math.log10(num_copies)

    # Start with the first copy
    result = add_slight_variation(base_audio, 30) if add_variation else base_audio

    # Layer additional copies with slight volume reduction per layer
    # This prevents clipping while still getting the crowd effect
    for _ in range(1, num_layers):
        copy = add_slight_variation(base_audio, 30) if add_variation else base_audio
        # Each layer slightly quieter to prevent clipping
        copy = copy - (3 * math.log10(num_layers))
        result = result.overlay(copy)

    # Now boost the entire result by the theoretical crowd size
    result = result + db_increase

    return result

def mix_agree_disagree_crowds(agree_audio, disagree_audio):
    """
    Mix two crowd audios together.
    The crowd sizes are already represented in the layering - just overlay them directly.
    """
    # Make them the same length
    max_length = max(len(agree_audio), len(disagree_audio))

    if len(agree_audio) < max_length:
        agree_audio = agree_audio + AudioSegment.silent(duration=max_length - len(agree_audio))
    if len(disagree_audio) < max_length:
        disagree_audio = disagree_audio + AudioSegment.silent(duration=max_length - len(disagree_audio))

    # Simply overlay the two crowds - their volumes are already correct
    # from the number of voices layered in create_crowd_audio()
    mixed = agree_audio.overlay(disagree_audio)

    # Normalize to prevent clipping
    if mixed.max_dBFS > -1:
        mixed = mixed.normalize(headroom=1.0)

    return mixed

def generate_audio_for_issue(issue_data, index):
    """Generate all audio files for a single issue using crowd simulation."""
    issue_name = issue_data['issue'].replace(' ', '_').replace('/', '_')
    statement = issue_data['statement']

    sci_consensus = float(issue_data['scientific_consensus'])
    pub_agreement = float(issue_data['public_agreement'])

    print(f"\nGenerating audio for: {issue_data['issue']}")
    print(f"  Scientific: {sci_consensus}% agree")
    print(f"  Public: {pub_agreement}% agree")

    # Calculate number of voices for each group
    sci_agree_count = round(NUM_VOICES * sci_consensus / 100)
    sci_disagree_count = NUM_VOICES - sci_agree_count
    pub_agree_count = round(NUM_VOICES * pub_agreement / 100)
    pub_disagree_count = NUM_VOICES - pub_agree_count

    print(f"  Simulating {NUM_VOICES} voices:")
    print(f"    Scientific: {sci_agree_count} agree, {sci_disagree_count} disagree")
    print(f"    Public: {pub_agree_count} agree, {pub_disagree_count} disagree")

    # Generate base TTS files with different voices
    agree_text = f"I believe {statement}"
    disagree_text = f"I don't believe {statement}"

    agree_temp = f"{TEMP_DIR}/{issue_name}_agree.mp3"
    disagree_temp = f"{TEMP_DIR}/{issue_name}_disagree.mp3"

    print("  Generating base TTS files...")
    if not generate_tts(agree_text, agree_temp, voice_type='com'):
        return False
    if not generate_tts(disagree_text, disagree_temp, voice_type='co.uk'):
        return False

    # Load base audio
    agree_base = AudioSegment.from_mp3(agree_temp)
    disagree_base = AudioSegment.from_mp3(disagree_temp)

    # Generate Scientific audio files
    print("  Creating scientific consensus crowds...")

    # Just agree
    if sci_agree_count > 0:
        sci_agree_crowd = create_crowd_audio(agree_base, sci_agree_count, add_variation=True)
        sci_agree_file = f"{AUDIO_DIR}/{index:02d}_sci_agree.mp3"
        sci_agree_crowd.export(sci_agree_file, format='mp3')
    else:
        # Silent if 0%
        AudioSegment.silent(duration=len(agree_base)).export(
            f"{AUDIO_DIR}/{index:02d}_sci_agree.mp3", format='mp3'
        )

    # Just disagree
    if sci_disagree_count > 0:
        sci_disagree_crowd = create_crowd_audio(disagree_base, sci_disagree_count, add_variation=True)
        sci_disagree_file = f"{AUDIO_DIR}/{index:02d}_sci_disagree.mp3"
        sci_disagree_crowd.export(sci_disagree_file, format='mp3')
    else:
        AudioSegment.silent(duration=len(disagree_base)).export(
            f"{AUDIO_DIR}/{index:02d}_sci_disagree.mp3", format='mp3'
        )

    # Both together
    print("  Mixing scientific agree + disagree...")
    sci_agree_for_mix = create_crowd_audio(agree_base, sci_agree_count, add_variation=True) if sci_agree_count > 0 else AudioSegment.silent(duration=len(agree_base))
    sci_disagree_for_mix = create_crowd_audio(disagree_base, sci_disagree_count, add_variation=True) if sci_disagree_count > 0 else AudioSegment.silent(duration=len(disagree_base))
    sci_both = mix_agree_disagree_crowds(sci_agree_for_mix, sci_disagree_for_mix)
    sci_both.export(f"{AUDIO_DIR}/{index:02d}_sci_both.mp3", format='mp3')

    # Generate Public audio files
    print("  Creating public opinion crowds...")

    # Just agree
    if pub_agree_count > 0:
        pub_agree_crowd = create_crowd_audio(agree_base, pub_agree_count, add_variation=True)
        pub_agree_file = f"{AUDIO_DIR}/{index:02d}_pub_agree.mp3"
        pub_agree_crowd.export(pub_agree_file, format='mp3')
    else:
        AudioSegment.silent(duration=len(agree_base)).export(
            f"{AUDIO_DIR}/{index:02d}_pub_agree.mp3", format='mp3'
        )

    # Just disagree
    if pub_disagree_count > 0:
        pub_disagree_crowd = create_crowd_audio(disagree_base, pub_disagree_count, add_variation=True)
        pub_disagree_file = f"{AUDIO_DIR}/{index:02d}_pub_disagree.mp3"
        pub_disagree_crowd.export(pub_disagree_file, format='mp3')
    else:
        AudioSegment.silent(duration=len(disagree_base)).export(
            f"{AUDIO_DIR}/{index:02d}_pub_disagree.mp3", format='mp3'
        )

    # Both together
    print("  Mixing public agree + disagree...")
    pub_agree_for_mix = create_crowd_audio(agree_base, pub_agree_count, add_variation=True) if pub_agree_count > 0 else AudioSegment.silent(duration=len(agree_base))
    pub_disagree_for_mix = create_crowd_audio(disagree_base, pub_disagree_count, add_variation=True) if pub_disagree_count > 0 else AudioSegment.silent(duration=len(disagree_base))
    pub_both = mix_agree_disagree_crowds(pub_agree_for_mix, pub_disagree_for_mix)
    pub_both.export(f"{AUDIO_DIR}/{index:02d}_pub_both.mp3", format='mp3')

    print(f"  ✓ Generated 6 audio files for {issue_data['issue']}")
    return True

def main():
    """Main function to generate all audio files."""
    print("Consensus Disagreement Audio Generator")
    print("=" * 50)
    print(f"Simulating {NUM_VOICES} voices per perspective")
    print("=" * 50)

    ensure_directories()

    print(f"\nLoading data from {CSV_FILE}...")
    data = load_csv_data()
    print(f"Found {len(data)} issues")

    success_count = 0
    for index, issue in enumerate(data):
        if generate_audio_for_issue(issue, index):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Generation complete: {success_count}/{len(data)} issues processed")
    print(f"Audio files saved to: {AUDIO_DIR}/")
    print("\nFile naming convention:")
    print("  XX_sci_agree.mp3   - Scientific consensus agree voices")
    print("  XX_sci_disagree.mp3 - Scientific consensus disagree voices")
    print("  XX_sci_both.mp3    - Scientific consensus both mixed")
    print("  XX_pub_agree.mp3   - Public opinion agree voices")
    print("  XX_pub_disagree.mp3 - Public opinion disagree voices")
    print("  XX_pub_both.mp3    - Public opinion both mixed")
    print(f"\nEach file simulates {NUM_VOICES} people speaking")

if __name__ == '__main__':
    main()
