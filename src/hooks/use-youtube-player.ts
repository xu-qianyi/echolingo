"use client"

import { useEffect, useRef, useState } from "react"

const SCRIPT_SRC = "https://www.youtube.com/iframe_api"

export function useYouTubePlayer(containerId: string, videoId: string) {
  const playerRef = useRef<YT.Player | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    function createPlayer() {
      if (!active || !document.getElementById(containerId)) return
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => { if (active) setIsReady(true) },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        createPlayer()
      }
      if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const s = document.createElement("script")
        s.src = SCRIPT_SRC
        document.head.appendChild(s)
      }
    }

    return () => {
      active = false
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
      setIsReady(false)
    }
  }, [containerId, videoId])

  function seekTo(seconds: number) {
    playerRef.current?.seekTo(seconds, true)
  }

  function getCurrentTime(): number {
    return playerRef.current?.getCurrentTime() ?? 0
  }

  return { isReady, seekTo, getCurrentTime }
}
