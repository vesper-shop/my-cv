import type { Locale, Messages } from "./types";

export const MESSAGES: Record<Locale, Messages> = {
  en: {
    title: "CV",
    description: "A CV with sensitive details hidden until you enter an access code.",
    summary: "Summary",
    hireTitle: "Hire me to unlock my full talent",
    codePlaceholder: "Access code",
    unlock: "Unlock",
    checking: "Checking",
    codeRequired: "Enter the code you were given.",
    codeRejected: "That code doesn't unlock this CV.",
    unlockedAs: (version) =>
      version === "grad" ? "Full CV for graduate applications" : "Full CV for job applications",
    hide: "Hide details",
    toggleTheme: "Toggle theme",
    switchLocale: "中文",
    downloadPdf: "Download PDF",
  },
  zh: {
    title: "简历",
    description: "隐藏了敏感信息的简历，输入访问口令即可查看完整内容。",
    summary: "简介",
    hireTitle: "雇用我，解锁全部实力",
    codePlaceholder: "访问口令",
    unlock: "解锁",
    checking: "验证中",
    codeRequired: "请输入收到的访问口令。",
    codeRejected: "口令不正确。",
    unlockedAs: (version) => (version === "grad" ? "申研版完整简历" : "求职版完整简历"),
    hide: "重新隐藏",
    toggleTheme: "切换主题",
    switchLocale: "English",
    downloadPdf: "下载 PDF",
  },
};
