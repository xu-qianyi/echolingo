declare namespace YT {
  class Player {
    constructor(el: string | HTMLElement, opts: PlayerOptions)
    getCurrentTime(): number
    seekTo(seconds: number, allowSeekAhead: boolean): void
    playVideo(): void
    pauseVideo(): void
    getPlayerState(): PlayerState
    destroy(): void
  }

  interface PlayerOptions {
    videoId?: string
    width?: string | number
    height?: string | number
    playerVars?: {
      autoplay?: 0 | 1
      modestbranding?: 0 | 1
      rel?: 0 | 1
      enablejsapi?: 0 | 1
      playsinline?: 0 | 1
    }
    events?: {
      onReady?: (e: { target: Player }) => void
      onStateChange?: (e: { target: Player; data: PlayerState }) => void
    }
  }

  const enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

interface Window {
  YT: typeof YT
  onYouTubeIframeAPIReady?: () => void
}
