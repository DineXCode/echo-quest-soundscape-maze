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
    // Generate realistic footstep sounds
    this.sounds.set('footstep-normal', this.generateFootstep('stone', 0.5));
    this.sounds.set('footstep-correct', this.generateFootstep('grass', 0.8));
    
    // Generate wall collision sound (solid impact)
    this.sounds.set('wall-collision', this.generateWallHit());
    
    // Generate echo sound (reverb-heavy tone)
    this.sounds.set('open-space', this.generateEcho());
    
    // Generate goal glow sound (warm, inviting)
    this.sounds.set('goal-close', this.generateGoalGlow(0.3));
    this.sounds.set('goal-medium', this.generateGoalGlow(0.6));
    this.sounds.set('goal-near', this.generateGoalGlow(1.0));
    
    // Generate epic celebration sound
    this.sounds.set('celebration', this.generateEpicCelebration());
  }

  private generateFootstep(surface: 'stone' | 'grass' | 'wood', volume: number): AudioBuffer {
    const length = this.audioContext.sampleRate * 0.15; // 150ms
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      
      let envelope: number;
      let noise: number;
      
      if (surface === 'stone') {
        // Stone: sharp attack, quick decay, high frequency noise
        envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 50));
        noise = (Math.random() - 0.5) * 2 * 0.7;
        const stoneRing = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 8) * 0.3;
        data[i] = (noise + stoneRing) * envelope * volume * 0.6;
      } else if (surface === 'grass') {
        // Grass: softer attack, longer decay, lower frequency
        envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 30));
        noise = (Math.random() - 0.5) * 2 * 0.5;
        const grassRustle = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 5) * 0.4;
        data[i] = (noise + grassRustle) * envelope * volume * 0.7;
      } else {
        // Wood: medium attack, medium decay, hollow sound
        envelope = Math.exp(-t * 12) * (1 - Math.exp(-t * 40));
        noise = (Math.random() - 0.5) * 2 * 0.6;
        const woodHollow = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 6) * 0.5;
        data[i] = (noise + woodHollow) * envelope * volume * 0.65;
      }
    }
    return buffer;
  }

  private generateWallHit(): AudioBuffer {
    const length = this.audioContext.sampleRate * 0.4; // 400ms
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate wall hit: solid impact with resonance
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      
      // Sharp impact at the beginning
      const impact = Math.exp(-t * 50) * (1 - Math.exp(-t * 200));
      
      // Resonant frequencies for solid surface
      const resonance1 = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 3) * 0.4;
      const resonance2 = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 4) * 0.3;
      const resonance3 = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 6) * 0.2;
      
      // Low frequency thud
      const thud = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 2) * 0.5;
      
      data[i] = (impact + resonance1 + resonance2 + resonance3 + thud) * 0.4;
    }
    return buffer;
  }

  private generateEcho(): AudioBuffer {
    const length = this.audioContext.sampleRate * 1.2; // 1.2 seconds
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate echo: atmospheric space sound
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      
      // Base atmospheric tone
      const baseTone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 1.2) * 0.3;
      
      // Echo reflections
      const echo1 = Math.sin(2 * Math.PI * 180 * (t - 0.1)) * Math.exp(-(t - 0.1) * 1.5) * 0.2;
      const echo2 = Math.sin(2 * Math.PI * 180 * (t - 0.2)) * Math.exp(-(t - 0.2) * 1.8) * 0.15;
      
      // Ambient noise
      const ambient = (Math.random() - 0.5) * 0.1 * Math.exp(-t * 2);
      
      data[i] = baseTone + (t > 0.1 ? echo1 : 0) + (t > 0.2 ? echo2 : 0) + ambient;
    }
    return buffer;
  }

  private generateGoalGlow(volume: number): AudioBuffer {
    const length = this.audioContext.sampleRate * 1.5; // 1.5 seconds
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate warm, glowing sound
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      
      // Warm fundamental frequency
      const fundamental = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 1.5) * 0.4;
      
      // Harmonic series for warmth
      const harmonic2 = Math.sin(2 * Math.PI * 440 * 2 * t) * Math.exp(-t * 1.8) * 0.3;
      const harmonic3 = Math.sin(2 * Math.PI * 440 * 3 * t) * Math.exp(-t * 2.0) * 0.2;
      const harmonic4 = Math.sin(2 * Math.PI * 440 * 4 * t) * Math.exp(-t * 2.2) * 0.15;
      
      // Gentle modulation for "glow" effect
      const modulation = 1 + 0.1 * Math.sin(2 * Math.PI * 2 * t);
      
      // Soft attack and long decay
      const envelope = (1 - Math.exp(-t * 3)) * Math.exp(-t * 1.2);
      
      data[i] = (fundamental + harmonic2 + harmonic3 + harmonic4) * envelope * modulation * volume * 0.5;
    }
    return buffer;
  }

  private generateEpicCelebration(): AudioBuffer {
    const length = this.audioContext.sampleRate * 4.0; // 4 seconds
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate epic celebration with multiple instruments
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const phase = t / 4.0; // 0 to 1 over 4 seconds
      
      let frequency = 523; // C5
      let melody = 0;
      
      // Epic melody progression
      if (phase < 0.25) {
        frequency = 523; // C5
        melody = Math.sin(2 * Math.PI * frequency * t);
      } else if (phase < 0.5) {
        frequency = 659; // E5
        melody = Math.sin(2 * Math.PI * frequency * t);
      } else if (phase < 0.75) {
        frequency = 784; // G5
        melody = Math.sin(2 * Math.PI * frequency * t);
      } else {
        frequency = 1047; // C6
        melody = Math.sin(2 * Math.PI * frequency * t);
      }
      
      // Rich harmonics for orchestral sound
      const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.4;
      const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.3;
      const harmonic4 = Math.sin(2 * Math.PI * frequency * 4 * t) * 0.2;
      
      // Bass line
      const bass = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.6;
      
      // Percussion (timpani-like)
      const percussion = Math.exp(-t * 8) * (1 - Math.exp(-t * 50)) * 0.8;
      
      // Choir-like pad
      const choir = Math.sin(2 * Math.PI * frequency * 0.25 * t) * Math.exp(-t * 0.5) * 0.3;
      
      // Dynamic envelope
      const envelope = (1 - Math.exp(-t * 5)) * Math.exp(-t * 0.6);
      
      // Tremolo and vibrato for epic effect
      const tremolo = 1 + 0.15 * Math.sin(2 * Math.PI * 8 * t);
      const vibrato = 1 + 0.1 * Math.sin(2 * Math.PI * 6 * t);
      
      data[i] = (melody + harmonic2 + harmonic3 + harmonic4 + bass + choir) * envelope * tremolo * vibrato * 0.4 + percussion;
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

  playGoalGlow(distance: number): void {
    let soundName = 'goal-close';
    if (distance <= 2) soundName = 'goal-near';
    else if (distance <= 4) soundName = 'goal-medium';
    
    this.playSound(soundName);
  }

  playCelebration(): void {
    this.playSound('celebration');
  }
}