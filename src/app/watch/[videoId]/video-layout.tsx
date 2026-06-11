"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Languages, MessageSquare, PenLine } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useYouTubePlayer } from "@/hooks/use-youtube-player"
import { TranscriptSegment } from "@/components/transcript-segment"
import { WordPopup } from "@/components/word-popup"
import { shouldHighlight, tokenize, type CefrLevel } from "@/data/cefr-words"
import type { TranscriptSegment as Segment } from "@/app/api/transcript/[videoId]/route"
import { cn } from "@/lib/utils"

type Tab = "transcript" | "notes" | "chat"

const PLAYER_ID = "yt-player"
const POLL_MS = 250

export function VideoLayout({ videoId }: { videoId: string }) {
  const { t, cefrLevel } = useLanguage()
  const { isReady, seekTo, getCurrentTime } = useYouTubePlayer(PLAYER_ID, videoId)

  const [segments, setSegments] = useState<Segment[]>([])
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [activeTab, setActiveTab] = useState<Tab>("transcript")
  const [popup, setPopup] = useState<{ word: string; rect: DOMRect } | null>(null)

  const segmentRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastActiveIdx = useRef(-1)

  useEffect(() => {
    setSegments([])
    setTranscriptError(null)
    fetch(`/api/transcript/${videoId}?level=${cefrLevel}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setTranscriptError(data.error)
        else setSegments(data.segments)
      })
      .catch(() => setTranscriptError("fetch_failed"))
  }, [videoId, cefrLevel])

  useEffect(() => {
    if (!isReady || !segments.length) return
    const id = setInterval(() => {
      const ms = getCurrentTime() * 1000
      const idx = segments.findIndex((s) => ms >= s.startMs && ms < s.endMs)
      setActiveIdx(idx)
    }, POLL_MS)
    return () => clearInterval(id)
  }, [isReady, segments, getCurrentTime])

  useEffect(() => {
    if (activeIdx < 0 || activeIdx === lastActiveIdx.current) return
    lastActiveIdx.current = activeIdx
    segmentRefs.current[activeIdx]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [activeIdx])

  const handleSeek = useCallback((ms: number) => seekTo(ms / 1000), [seekTo])
  const handleWordClick = useCallback((word: string, rect: DOMRect) => setPopup({ word, rect }), [])

  const currentSeg = activeIdx >= 0 ? segments[activeIdx] : null
  const nextSeg = activeIdx >= 0 ? segments[activeIdx + 1] : null

  return (
    <>
      <div className="flex flex-1 min-h-0 gap-6 px-20 py-8 bg-stone-100/60">

        {/* ── Left column ── */}
        <div className="flex flex-col w-2/3 min-h-0 gap-6">

          {/* Video */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-900 shrink-0 shadow-sm ring-1 ring-stone-900/5">
            <div id={PLAYER_ID} className="w-full h-full" />
          </div>

          {/* Learning display */}
          <div className="flex flex-col flex-1 min-h-0 rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5 overflow-hidden">
            {/* Current + next sentence */}
            <div className="flex-1 overflow-hidden flex flex-col justify-center px-8 py-6 gap-5">
              {!segments.length ? (
                <p className="text-stone-300 text-xl">{t.watch.transcriptLoading}</p>
              ) : activeIdx < 0 ? (
                <p className="text-stone-300 text-xl">播放视频开始学习</p>
              ) : (
                <>
                  {/* Current sentence — large */}
                  <LearningText
                    text={currentSeg?.text ?? ""}
                    userLevel={cefrLevel}
                    onWordClick={handleWordClick}
                    size="current"
                  />

                  {/* Next sentence — faint */}
                  {nextSeg && (
                    <LearningText
                      text={nextSeg.text}
                      userLevel={cefrLevel}
                      onWordClick={handleWordClick}
                      size="next"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col w-1/3 min-h-0 rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5 overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-stone-100 shrink-0">
            <div className="flex items-center gap-1 flex-1 bg-stone-100 rounded-xl p-1">
              <TabBtn active={activeTab === "transcript"} onClick={() => setActiveTab("transcript")}>
                <Languages className="w-3.5 h-3.5" />
                字幕
              </TabBtn>
              <TabBtn active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>
                <PenLine className="w-3.5 h-3.5" />
                生词本
              </TabBtn>
              <TabBtn active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>
                <MessageSquare className="w-3.5 h-3.5" />
                AI 聊天
              </TabBtn>
            </div>
          </div>

          {/* Transcript tab — always mounted so refs work */}
          <div className={cn("flex-1 overflow-y-auto px-2 py-2", activeTab !== "transcript" && "hidden")}>
            {transcriptError ? (
              <TranscriptError error={transcriptError} />
            ) : !segments.length ? (
              <p className="text-sm text-stone-400 px-2 py-4">{t.watch.transcriptLoading}</p>
            ) : (
              <div className="space-y-0.5">
                {segments.map((seg, i) => (
                  <div key={i} ref={(el) => { segmentRefs.current[i] = el }}>
                    <TranscriptSegment
                      text={seg.text}
                      startMs={seg.startMs}
                      isActive={activeIdx === i}
                      userLevel={cefrLevel}
                      onSeek={handleSeek}
                      onWordClick={handleWordClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes tab */}
          <div className={cn("flex-1 overflow-y-auto p-4", activeTab !== "notes" && "hidden")}>
            <p className="text-sm text-stone-400">{t.watch.notesLoading}</p>
          </div>

          {/* Chat tab */}
          <div className={cn("flex-1 overflow-y-auto p-4", activeTab !== "chat" && "hidden")}>
            <p className="text-sm text-stone-400">AI 聊天即将上线</p>
          </div>

        </div>
      </div>

      {popup && (
        <WordPopup word={popup.word} anchorRect={popup.rect} onClose={() => setPopup(null)} />
      )}
    </>
  )
}

// ── Learning display text ────────────────────────────────────────────────────

function LearningText({
  text, userLevel, onWordClick, size,
}: {
  text: string
  userLevel: CefrLevel
  onWordClick: (word: string, rect: DOMRect) => void
  size: "current" | "next"
}) {
  const tokens = tokenize(text)
  const isCurrent = size === "current"

  return (
    <p className={cn(
      "leading-relaxed transition-all duration-300",
      isCurrent
        ? "text-3xl font-medium text-stone-900"
        : "text-xl text-stone-300"
    )}>
      {tokens.map((token, i) => {
        const isWord = /^[a-zA-Z'-]+$/.test(token)
        if (!isWord) return <span key={i}>{token}</span>

        const highlight = shouldHighlight(token, userLevel)
        if (!highlight) return <span key={i}>{token}</span>

        return (
          <button
            key={i}
            onClick={(e) => {
              if (!isCurrent) return
              e.stopPropagation()
              onWordClick(token, (e.currentTarget as HTMLElement).getBoundingClientRect())
            }}
            className={cn(
              "relative inline-block rounded-md transition-colors",
              isCurrent
                ? "bg-stone-100 text-stone-900 px-1 mx-0.5 hover:bg-stone-200 cursor-pointer underline decoration-dotted decoration-stone-400 underline-offset-4"
                : "text-stone-300 cursor-default"
            )}
          >
            {token}
          </button>
        )
      })}
    </p>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all",
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
      )}
    >
      {children}
    </button>
  )
}

function TranscriptError({ error }: { error: string }) {
  return (
    <div className="py-6 px-2 text-center">
      <p className="text-sm text-stone-500">
        {error === "no_transcript"
          ? "该视频没有可用的字幕，请换一个视频试试。"
          : "字幕加载失败，请刷新重试。"}
      </p>
    </div>
  )
}
