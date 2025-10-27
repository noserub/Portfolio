# Prompt 5b: Audio/Media Optimization Add-On

## When to Use
**For projects with audio/video features** - Use this after core architecture is in place.

## Objective
Implement efficient audio streaming, Web Audio API integration, progressive loading, CDN configuration, and cost-optimized storage for music and media applications.

## Instructions

### Step 1: Audio Streaming Architecture
Set up efficient audio streaming:

1. **Audio Stream Manager**
   ```typescript
   // src/services/audioStreamManager.ts
   interface AudioStreamConfig {
     bufferSize: number;
     preloadSize: number;
     quality: 'low' | 'medium' | 'high';
     format: 'mp3' | 'ogg' | 'webm';
   }
   
   export class AudioStreamManager {
     private audioContext: AudioContext;
     private source: AudioBufferSourceNode | null = null;
     private config: AudioStreamConfig;
     private buffer: AudioBuffer | null = null;
   
     constructor(config: AudioStreamConfig) {
       this.config = config;
       this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
     }
   
     async loadAudio(url: string): Promise<void> {
       try {
         const response = await fetch(url);
         const arrayBuffer = await response.arrayBuffer();
         this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
       } catch (error) {
         console.error('Error loading audio:', error);
         throw error;
       }
     }
   
     play(): void {
       if (!this.buffer) throw new Error('No audio buffer loaded');
   
       this.source = this.audioContext.createBufferSource();
       this.source.buffer = this.buffer;
       this.source.connect(this.audioContext.destination);
       this.source.start();
     }
   
     pause(): void {
       if (this.source) {
         this.source.stop();
         this.source = null;
       }
     }
   
     getCurrentTime(): number {
       return this.audioContext.currentTime;
     }
   
     getDuration(): number {
       return this.buffer?.duration || 0;
     }
   }
   ```

2. **Progressive Audio Loader**
   ```typescript
   // src/utils/progressiveAudioLoader.ts
   export class ProgressiveAudioLoader {
     private chunks: ArrayBuffer[] = [];
     private totalSize: number = 0;
     private loadedSize: number = 0;
   
     async loadAudioChunked(url: string, onProgress?: (progress: number) => void): Promise<AudioBuffer> {
       const response = await fetch(url, { headers: { 'Range': 'bytes=0-' } });
       const contentLength = parseInt(response.headers.get('Content-Length') || '0');
       this.totalSize = contentLength;
   
       const reader = response.body?.getReader();
       if (!reader) throw new Error('No reader available');
   
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
   
         this.chunks.push(value);
         this.loadedSize += value.length;
   
         if (onProgress) {
           onProgress(this.loadedSize / this.totalSize);
         }
       }
   
       const audioContext = new AudioContext();
       const combinedBuffer = this.combineChunks();
       return await audioContext.decodeAudioData(combinedBuffer);
     }
   
     private combineChunks(): ArrayBuffer {
       const totalLength = this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
       const result = new Uint8Array(totalLength);
       let offset = 0;
   
       for (const chunk of this.chunks) {
           result.set(new Uint8Array(chunk), offset);
           offset += chunk.byteLength;
       }
   
       return result.buffer;
     }
   }
   ```

### Step 2: Web Audio API Integration
Implement advanced audio processing:

1. **Audio Analyzer**
   ```typescript
   // src/utils/audioAnalyzer.ts
   export class AudioAnalyzer {
     private audioContext: AudioContext;
     private analyser: AnalyserNode;
     private dataArray: Uint8Array;
     private animationId: number | null = null;
   
     constructor(audioContext: AudioContext) {
       this.audioContext = audioContext;
       this.analyser = audioContext.createAnalyser();
       this.analyser.fftSize = 256;
       this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
     }
   
     connect(source: AudioNode): void {
       source.connect(this.analyser);
     }
   
     getFrequencyData(): Uint8Array {
       this.analyser.getByteFrequencyData(this.dataArray);
       return this.dataArray;
     }
   
     getTimeDomainData(): Uint8Array {
       this.analyser.getByteTimeDomainData(this.dataArray);
       return this.dataArray;
     }
   
     startVisualization(callback: (data: Uint8Array) => void): void {
       const animate = () => {
         const data = this.getFrequencyData();
         callback(data);
         this.animationId = requestAnimationFrame(animate);
       };
       animate();
     }
   
     stopVisualization(): void {
       if (this.animationId) {
         cancelAnimationFrame(this.animationId);
         this.animationId = null;
       }
     }
   }
   ```

2. **Beat Detection**
   ```typescript
   // src/utils/beatDetector.ts
   export class BeatDetector {
     private audioAnalyzer: AudioAnalyzer;
     private beatThreshold: number = 0.3;
     private lastBeatTime: number = 0;
     private beatInterval: number = 0;
   
     constructor(audioAnalyzer: AudioAnalyzer) {
       this.audioAnalyzer = audioAnalyzer;
     }
   
     detectBeat(): boolean {
       const frequencyData = this.audioAnalyzer.getFrequencyData();
       const bassFreq = this.getBassFrequency(frequencyData);
       const currentTime = Date.now();
   
       if (bassFreq > this.beatThreshold && currentTime - this.lastBeatTime > this.beatInterval) {
         this.lastBeatTime = currentTime;
         this.updateBeatInterval();
         return true;
       }
   
       return false;
     }
   
     private getBassFrequency(data: Uint8Array): number {
       const bassRange = data.slice(0, 8);
       return bassRange.reduce((sum, value) => sum + value, 0) / bassRange.length / 255;
     }
   
     private updateBeatInterval(): void {
       const currentTime = Date.now();
       if (this.lastBeatTime > 0) {
         this.beatInterval = currentTime - this.lastBeatTime;
       }
     }
   }
   ```

### Step 3: Audio Player Component
Create a comprehensive audio player:

1. **Audio Player Hook**
   ```typescript
   // src/hooks/useAudioPlayer.ts
   import { useState, useRef, useEffect } from 'react';
   
   interface AudioPlayerState {
     isPlaying: boolean;
     currentTime: number;
     duration: number;
     volume: number;
     playbackRate: number;
   }
   
   export function useAudioPlayer() {
     const [state, setState] = useState<AudioPlayerState>({
       isPlaying: false,
       currentTime: 0,
       duration: 0,
       volume: 1,
       playbackRate: 1
     });
   
     const audioRef = useRef<HTMLAudioElement>(null);
     const audioContextRef = useRef<AudioContext | null>(null);
     const analyserRef = useRef<AudioAnalyzer | null>(null);
   
     useEffect(() => {
       if (audioRef.current) {
         const audio = audioRef.current;
   
         const handleTimeUpdate = () => {
           setState(prev => ({ ...prev, currentTime: audio.currentTime }));
         };
   
         const handleLoadedMetadata = () => {
           setState(prev => ({ ...prev, duration: audio.duration }));
         };
   
         const handlePlay = () => {
           setState(prev => ({ ...prev, isPlaying: true }));
         };
   
         const handlePause = () => {
           setState(prev => ({ ...prev, isPlaying: false }));
         };
   
         audio.addEventListener('timeupdate', handleTimeUpdate);
         audio.addEventListener('loadedmetadata', handleLoadedMetadata);
         audio.addEventListener('play', handlePlay);
         audio.addEventListener('pause', handlePause);
   
         return () => {
           audio.removeEventListener('timeupdate', handleTimeUpdate);
           audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
           audio.removeEventListener('play', handlePlay);
           audio.removeEventListener('pause', handlePause);
         };
       }
     }, []);
   
     const play = () => {
       audioRef.current?.play();
     };
   
     const pause = () => {
       audioRef.current?.pause();
     };
   
     const seek = (time: number) => {
       if (audioRef.current) {
         audioRef.current.currentTime = time;
       }
     };
   
     const setVolume = (volume: number) => {
       if (audioRef.current) {
         audioRef.current.volume = volume;
         setState(prev => ({ ...prev, volume }));
       }
     };
   
     const setPlaybackRate = (rate: number) => {
       if (audioRef.current) {
         audioRef.current.playbackRate = rate;
         setState(prev => ({ ...prev, playbackRate: rate }));
       }
     };
   
     return {
       ...state,
       play,
       pause,
       seek,
       setVolume,
       setPlaybackRate,
       audioRef
     };
   }
   ```

2. **Audio Player Component**
   ```typescript
   // src/components/AudioPlayer.tsx
   import React from 'react';
   import { useAudioPlayer } from '../hooks/useAudioPlayer';
   
   interface AudioPlayerProps {
     src: string;
     title?: string;
     artist?: string;
     onTimeUpdate?: (time: number) => void;
   }
   
   export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
     src, 
     title, 
     artist, 
     onTimeUpdate 
   }) => {
     const {
       isPlaying,
       currentTime,
       duration,
       volume,
       play,
       pause,
       seek,
       setVolume,
       audioRef
     } = useAudioPlayer();
   
     const formatTime = (seconds: number): string => {
       const mins = Math.floor(seconds / 60);
       const secs = Math.floor(seconds % 60);
       return `${mins}:${secs.toString().padStart(2, '0')}`;
     };
   
     const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
       const time = parseFloat(e.target.value);
       seek(time);
     };
   
     const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const newVolume = parseFloat(e.target.value);
       setVolume(newVolume);
     };
   
     return (
       <div className="audio-player">
         <audio ref={audioRef} src={src} preload="metadata" />
         
         <div className="player-info">
           <h3>{title}</h3>
           <p>{artist}</p>
         </div>
   
         <div className="player-controls">
           <button onClick={isPlaying ? pause : play}>
             {isPlaying ? 'Pause' : 'Play'}
           </button>
           
           <div className="progress-container">
             <span>{formatTime(currentTime)}</span>
             <input
               type="range"
               min="0"
               max={duration || 0}
               value={currentTime}
               onChange={handleSeek}
               className="progress-bar"
             />
             <span>{formatTime(duration)}</span>
           </div>
   
           <div className="volume-container">
             <span>Volume</span>
             <input
               type="range"
               min="0"
               max="1"
               step="0.1"
               value={volume}
               onChange={handleVolumeChange}
               className="volume-bar"
             />
           </div>
         </div>
       </div>
     );
   };
   ```

### Step 4: Audio Visualizations
Implement psychedelic visualizations:

1. **Visualization Canvas**
   ```typescript
   // src/components/AudioVisualization.tsx
   import React, { useRef, useEffect } from 'react';
   import { AudioAnalyzer } from '../utils/audioAnalyzer';
   
   interface AudioVisualizationProps {
     audioAnalyzer: AudioAnalyzer;
     type: 'frequency' | 'waveform' | 'circular';
   }
   
   export const AudioVisualization: React.FC<AudioVisualizationProps> = ({ 
     audioAnalyzer, 
     type 
   }) => {
     const canvasRef = useRef<HTMLCanvasElement>(null);
     const animationRef = useRef<number | null>(null);
   
     useEffect(() => {
       const canvas = canvasRef.current;
       if (!canvas) return;
   
       const ctx = canvas.getContext('2d');
       if (!ctx) return;
   
       const animate = () => {
         const data = audioAnalyzer.getFrequencyData();
         const width = canvas.width;
         const height = canvas.height;
   
         ctx.clearRect(0, 0, width, height);
   
         switch (type) {
           case 'frequency':
             drawFrequencyBars(ctx, data, width, height);
             break;
           case 'waveform':
             drawWaveform(ctx, data, width, height);
             break;
           case 'circular':
             drawCircularVisualization(ctx, data, width, height);
             break;
         }
   
         animationRef.current = requestAnimationFrame(animate);
       };
   
       animate();
   
       return () => {
         if (animationRef.current) {
           cancelAnimationFrame(animationRef.current);
         }
       };
     }, [audioAnalyzer, type]);
   
     const drawFrequencyBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
       const barWidth = width / data.length;
   
       for (let i = 0; i < data.length; i++) {
         const barHeight = (data[i] / 255) * height;
         const x = i * barWidth;
         const y = height - barHeight;
   
         const hue = (i / data.length) * 360;
         ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
         ctx.fillRect(x, y, barWidth, barHeight);
       }
     };
   
     const drawWaveform = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
       ctx.beginPath();
       ctx.moveTo(0, height / 2);
   
       for (let i = 0; i < data.length; i++) {
         const x = (i / data.length) * width;
         const y = (data[i] / 255) * height;
         ctx.lineTo(x, y);
       }
   
       ctx.strokeStyle = '#00ff00';
       ctx.lineWidth = 2;
       ctx.stroke();
     };
   
     const drawCircularVisualization = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
       const centerX = width / 2;
       const centerY = height / 2;
       const radius = Math.min(width, height) / 2;
   
       for (let i = 0; i < data.length; i++) {
         const angle = (i / data.length) * Math.PI * 2;
         const distance = (data[i] / 255) * radius;
   
         const x = centerX + Math.cos(angle) * distance;
         const y = centerY + Math.sin(angle) * distance;
   
         const hue = (i / data.length) * 360;
         ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
         ctx.beginPath();
         ctx.arc(x, y, 2, 0, Math.PI * 2);
         ctx.fill();
       }
     };
   
     return (
       <canvas
         ref={canvasRef}
         width={800}
         height={400}
         className="audio-visualization"
       />
     );
   };
   ```

### Step 5: CDN Configuration
Set up cost-optimized CDN:

1. **CDN Manager**
   ```typescript
   // src/utils/cdnManager.ts
   export class CDNManager {
     private baseURL: string;
     private cache: Map<string, string> = new Map();
   
     constructor(baseURL: string) {
       this.baseURL = baseURL;
     }
   
     getOptimizedURL(path: string, options: {
       width?: number;
       height?: number;
       quality?: number;
       format?: string;
     } = {}): string {
       const cacheKey = `${path}-${JSON.stringify(options)}`;
       
       if (this.cache.has(cacheKey)) {
         return this.cache.get(cacheKey)!;
       }
   
       const params = new URLSearchParams();
       if (options.width) params.set('w', options.width.toString());
       if (options.height) params.set('h', options.height.toString());
       if (options.quality) params.set('q', options.quality.toString());
       if (options.format) params.set('f', options.format);
   
       const url = `${this.baseURL}/${path}?${params.toString()}`;
       this.cache.set(cacheKey, url);
       return url;
     }
   
     preloadAudio(urls: string[]): void {
       urls.forEach(url => {
         const link = document.createElement('link');
         link.rel = 'preload';
         link.href = url;
         link.as = 'audio';
         document.head.appendChild(link);
       });
     }
   }
   ```

### Step 6: Playlist Management
Implement playlist functionality:

1. **Playlist Hook**
   ```typescript
   // src/hooks/usePlaylist.ts
   import { useState, useCallback } from 'react';
   
   interface Track {
     id: string;
     title: string;
     artist: string;
     src: string;
     duration: number;
   }
   
   export function usePlaylist(initialTracks: Track[] = []) {
     const [tracks, setTracks] = useState<Track[]>(initialTracks);
     const [currentIndex, setCurrentIndex] = useState(0);
     const [shuffle, setShuffle] = useState(false);
     const [repeat, setRepeat] = useState(false);
   
     const currentTrack = tracks[currentIndex];
   
     const addTrack = useCallback((track: Track) => {
       setTracks(prev => [...prev, track]);
     }, []);
   
     const removeTrack = useCallback((id: string) => {
       setTracks(prev => prev.filter(track => track.id !== id));
     }, []);
   
     const nextTrack = useCallback(() => {
       if (shuffle) {
         const randomIndex = Math.floor(Math.random() * tracks.length);
         setCurrentIndex(randomIndex);
       } else {
         setCurrentIndex(prev => (prev + 1) % tracks.length);
       }
     }, [tracks.length, shuffle]);
   
     const previousTrack = useCallback(() => {
       setCurrentIndex(prev => (prev - 1 + tracks.length) % tracks.length);
     }, [tracks.length]);
   
     const toggleShuffle = useCallback(() => {
       setShuffle(prev => !prev);
     }, []);
   
     const toggleRepeat = useCallback(() => {
       setRepeat(prev => !prev);
     }, []);
   
     return {
       tracks,
       currentTrack,
       currentIndex,
       shuffle,
       repeat,
       addTrack,
       removeTrack,
       nextTrack,
       previousTrack,
       toggleShuffle,
       toggleRepeat
     };
   }
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ Efficient audio streaming with progressive loading
2. ✅ Web Audio API integration for advanced processing
3. ✅ Beat detection and audio analysis
4. ✅ Comprehensive audio player component
5. ✅ Psychedelic visualizations that sync with audio
6. ✅ CDN configuration for cost optimization
7. ✅ Playlist management functionality
8. ✅ Audio preloading and caching

## Next Steps
After completing audio optimization:
- Run **Prompt 3: Performance Optimization** to optimize the audio components
- Run **Prompt 4: Production Readiness** to prepare for deployment

## Notes
- Audio streaming is optimized for long tracks (5-15 minutes)
- Visualizations are GPU-accelerated for smooth performance
- CDN configuration minimizes bandwidth costs
- Beat detection provides real-time audio analysis
- All components are designed for music-focused applications

