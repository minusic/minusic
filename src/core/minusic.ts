import { ConstructorParameters, VisualizerOptions } from "../types"
import MinusicCore from "./minusicCore"

/**
 * Minusic - Advanced HTML5 audio player
 *
 * This class serves as a simplified public API facade for the MinusicCore implementation.
 * It maintains the same interface as the original Minusic class for backward compatibility.
 */
export default class Minusic {
  private core: MinusicCore

  constructor(options: ConstructorParameters) {
    this.core = new MinusicCore(options)
  }

  // ===== Cleanup =====
  public destroy(): void {
    this.core.destroy()
  }

  // ===== Playback Controls =====
  public play(): Promise<void> {
    return this.core.play()
  }

  public pause(): void {
    this.core.pause()
  }

  public stop(): void {
    this.core.stop()
  }

  public togglePlay(state?: boolean): Promise<void> | void {
    return this.core.togglePlay(state)
  }

  public backward(): void {
    this.core.backward()
  }

  public forward(): void {
    this.core.forward()
  }

  public restart(): void {
    this.core.restart()
  }

  // ===== Volume Controls =====
  public mute(): void {
    this.core.mute()
  }

  public unmute(): void {
    this.core.unmute()
  }

  public toggleMute(state?: boolean): void {
    this.core.toggleMute(state)
  }

  // ===== UI Controls =====
  public showControls = (): void => this.core.showControls()
  public hideControls = (): void => this.core.hideControls()
  public showNativeControls = (): void => this.core.showNativeControls()
  public hideNativeControls = (): void => this.core.hideNativeControls()
  public toggleControls = (): void => this.core.toggleControls()

  // ===== Playlist Controls =====
  public async loadTrack(index = 0, autoplay = false): Promise<boolean> {
    return this.core.loadTrack(index, autoplay)
  }

  public previousTrack(autoplay = false): Promise<boolean> {
    return this.core.previousTrack(autoplay)
  }

  public nextTrack(autoplay = false): Promise<boolean> {
    return this.core.nextTrack(autoplay)
  }

  public randomTrack(autoplay = false): Promise<boolean> {
    return this.core.randomTrack(autoplay)
  }

  public previousOrRestartTrack = (autoplay = false): void => {
    this.core.previousOrRestartTrack(autoplay)
  }

  public toggleRepeat = (): void => this.core.toggleRepeat()
  public repeatOne = (): void => this.core.repeatOne()
  public repeatAll = (): void => this.core.repeatAll()
  public noRepeat = (): void => this.core.noRepeat()
  public toggleRandom = (): void => this.core.toggleRandom()

  // ===== Visualizer Controls =====
  public toggleVisualizer(enabled?: boolean): void {
    this.core.toggleVisualizer(enabled)
  }

  public updateVisualizerOptions(options: Partial<VisualizerOptions>): boolean {
    return this.core.updateVisualizerOptions(options)
  }

  // ===== Property Getters/Setters =====

  // Playback properties
  get currentTime(): number {
    return this.core.currentTime
  }

  set currentTime(time: number) {
    this.core.currentTime = time
  }

  get duration(): number {
    return this.core.duration
  }

  get paused(): boolean {
    return this.core.paused
  }

  get progress(): number {
    return this.core.progress
  }

  get buffer(): number {
    return this.core.buffer
  }

  get buffered(): number {
    return this.core.buffered
  }

  get playbackRate(): number {
    return this.core.playbackRate
  }

  set playbackRate(rate: number) {
    this.core.playbackRate = rate
  }

  // Volume properties
  get volume(): number {
    return this.core.volume
  }

  set volume(value: number) {
    this.core.volume = value
  }

  get muted(): boolean {
    return this.core.muted
  }

  // Playlist properties
  get repeat(): number {
    return this.core.repeat
  }

  set repeat(value: number) {
    this.core.repeat = value
  }

  get random(): boolean {
    return this.core.random
  }

  get track(): number {
    return this.core.track
  }

  // Content properties
  get trackTitle(): string | null {
    return this.core.trackTitle
  }

  get audioSource(): string | null {
    return this.core.audioSource
  }
}
