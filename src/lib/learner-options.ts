import { type CefrLevel } from "@/data/cefr-words"
import { type Locale } from "@/lib/i18n"

// ── Native language (mother tongue) ─────────────────────────────────────────
// Distinct from `locale` (the UI language). This is the language the learner
// wants translations/definitions in. Only Chinese is wired up in v1; the others
// are shown as "coming soon" to gauge demand.
export type NativeLanguage = "zh" | "ko" | "es" | "fr"

export const NATIVE_LANGUAGES: {
  code: NativeLanguage
  label: string
  flag: string
  active: boolean
}[] = [
  { code: "zh", label: "中文", flag: "🇨🇳", active: true },
  { code: "ko", label: "한국어", flag: "🇰🇷", active: false },
  { code: "es", label: "Español", flag: "🇪🇸", active: false },
  { code: "fr", label: "Français", flag: "🇫🇷", active: false },
]

// Public, free CEFR self-test linked (optionally) from onboarding. Opens in a
// new tab so it never interrupts the flow. Cambridge English (University of
// Cambridge, non-profit) — free, no sign-up, results map to CEFR levels.
export const CEFR_TEST_URL = "https://www.cambridgeenglish.org/test-your-english/"

// ── CEFR levels with human-readable "can-do" descriptions ───────────────────
// Letter codes mean nothing to a learner, so every level carries a short band
// name + a concrete can-do statement to help people self-place.
export const CEFR_LEVELS: {
  code: CefrLevel
  band: Record<Locale, string>
  canDo: Record<Locale, string>
}[] = [
  {
    code: "a1",
    band: { zh: "入门", en: "Beginner" },
    canDo: {
      zh: "能听懂最简单的日常用语和自我介绍",
      en: "Understand basic everyday phrases and introductions",
    },
  },
  {
    code: "a2",
    band: { zh: "基础", en: "Elementary" },
    canDo: {
      zh: "能应付购物、问路等常见情景对话",
      en: "Handle common situations like shopping and directions",
    },
  },
  {
    code: "b1",
    band: { zh: "进阶", en: "Intermediate" },
    canDo: {
      zh: "能听懂熟悉话题、看懂大意，旅行交流无大碍",
      en: "Follow familiar topics, get the gist, and travel comfortably",
    },
  },
  {
    code: "b2",
    band: { zh: "中高级", en: "Upper-Intermediate" },
    canDo: {
      zh: "能看懂大部分影视内容、表达观点并参与讨论",
      en: "Understand most media, express opinions, and join discussions",
    },
  },
  {
    code: "c1",
    band: { zh: "高级", en: "Advanced" },
    canDo: {
      zh: "能轻松理解长篇内容和隐含意义，表达地道流畅",
      en: "Grasp long, implicit content and express yourself fluently",
    },
  },
]
