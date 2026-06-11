export type Locale = "zh" | "en"

export const locales: { code: Locale; label: string; flag: string }[] = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
]

export const translations = {
  zh: {
    landing: {
      title: "EchoLingo",
      subtitle: "粘贴 YouTube 链接，边看视频边学英语",
      placeholder: "粘贴 YouTube 链接，开始学习…",
      submit: "开始",
      invalidUrl: "请粘贴有效的 YouTube 链接",
    },
    watch: {
      studyNotes: "学习笔记",
      transcriptLoading: "字幕加载中…",
      notesLoading: "笔记生成中…",
      keyVocabulary: "核心词汇",
      keyExpressions: "核心表达",
      mySavedItems: "我的收藏",
      saveToNotes: "保存到笔记",
      explain: "解释",
      takeNotes: "添加笔记",
    },
  },
  en: {
    landing: {
      title: "EchoLingo",
      subtitle: "Paste a YouTube link to study English with synced subtitles",
      placeholder: "Paste a YouTube link to start learning…",
      submit: "Start",
      invalidUrl: "Please enter a valid YouTube link",
    },
    watch: {
      studyNotes: "Study Notes",
      transcriptLoading: "Loading transcript…",
      notesLoading: "Generating notes…",
      keyVocabulary: "Key Vocabulary",
      keyExpressions: "Key Expressions",
      mySavedItems: "My Saved Items",
      saveToNotes: "Save to Notes",
      explain: "Explain",
      takeNotes: "Take Notes",
    },
  },
} satisfies Record<Locale, unknown>

export type Translations = (typeof translations)[Locale]
