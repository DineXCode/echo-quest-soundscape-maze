export class AudioSystem {
  private audioContext: AudioContext;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;

  constructor() {
    // Initialize audio context when first needed
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Generate audio buffers programmatically for better accessibility
      await this.generateSounds();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private async generateSounds() {
    // Generate footstep sound (short percussion)
    this.sounds.set('footstep-normal', this.generateFootstep(0.5));
    this.sounds.set('footstep-correct', this.generateFootstep(0.8));
    
    // Generate wall collision sound (water drip)
    this.sounds.set('wall-collision', this.generateWaterDrip());
    
    // Generate echo sound (reverb-heavy tone)
    this.sounds.set('open-space', this.generateEcho());
    
    // Generate goal chime (ascending bell)
    this.sounds.set('goal-close', this.generateChime(0.3));
    this.sounds.set('goal-medium', this.generateChime(0.6));
    this.sounds.set('goal-near', this.generateChime(1.0));
  }

  private generateFootstep(volume: number): AudioBuffer {
    const length = this.audioContext.sampleRate * 0.1; // 100ms
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate footstep: quick attack, fast decay
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const envelope = Math.exp(-t * 20); // Fast decay
      const noise = (Math.random() - 0.5) * 2;
      data[i] = noise * envelope * volume * 0.5;
    }
    return buffer;
  }

  private generateWaterDrip(): AudioBuffer {
    const length = this.audioContext.sampleRate * 0.3; // 300ms
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate water drip: high frequency with echo
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const frequency = 800 + 400 * Math.exp(-t * 5); // Descending tone
      const envelope = Math.exp(-t * 3);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }
    return buffer;
  }

  private generateEcho(): AudioBuffer {
    const length = this.audioContext.sampleRate * 0.8; // 800ms
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate echo: low frequency with long reverb
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const frequency = 200;
      const envelope = Math.exp(-t * 1.5);
      const reverb = Math.sin(2 * Math.PI * frequency * t * 0.5) * 0.3;
      data[i] = (Math.sin(2 * Math.PI * frequency * t) + reverb) * envelope * 0.2;
    }
    return buffer;
  }

  private generateChime(volume: number): AudioBuffer {
    const length = this.audioContext.sampleRate * 1.0; // 1 second
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate chime: bell-like tone with harmonics
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const envelope = Math.exp(-t * 2);
      const fundamental = Math.sin(2 * Math.PI * 523 * t); // C5
      const harmonic2 = Math.sin(2 * Math.PI * 523 * 2 * t) * 0.5;
      const harmonic3 = Math.sin(2 * Math.PI * 523 * 3 * t) * 0.25;
      data[i] = (fundamental + harmonic2 + harmonic3) * envelope * volume * 0.4;
    }
    return buffer;
  }

  playSound(soundName: string, panValue: number = 0): void {
    if (!this.isInitialized || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const pannerNode = this.audioContext.createStereoPanner();

      source.buffer = buffer;
      pannerNode.pan.value = Math.max(-1, Math.min(1, panValue));
      
      // Connect audio nodes
      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Spatial audio for direction guidance
  playDirectionalFootstep(isCorrectDirection: boolean, panValue: number = 0): void {
    const soundName = isCorrectDirection ? 'footstep-correct' : 'footstep-normal';
    this.playSound(soundName, panValue);
  }

  playGoalChime(distance: number): void {
    let soundName = 'goal-close';
    if (distance <= 2) soundName = 'goal-near';
    else if (distance <= 4) soundName = 'goal-medium';
    
    this.playSound(soundName);
  }
}