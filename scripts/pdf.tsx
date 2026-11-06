import { renderDocumentWithLayout } from "@formepdf/core";
import { Document, Page, Text, View, type Style } from "@formepdf/react";
import { fileURLToPath } from "node:url";
import { reveal } from "../lib/cv";
import { MESSAGES } from "../lib/i18n";
import type { Cv, Entry, Locale, StoredPdf } from "../lib/types";

/* The full CV, so the Worker serves it to unlocked readers only. */

const MAX_PAGES = 2;

const INK = "#18181b";
const BODY = "#3f3f46";
const MUTED = "#71717a";
const LINE = "#e4e4e7";

const FONTS = [
  ["Inter", 400, "inter/400Regular/Inter_400Regular.ttf"],
  ["Inter", 600, "inter/600SemiBold/Inter_600SemiBold.ttf"],
  ["Noto Sans SC", 400, "noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf"],
  ["Noto Sans SC", 600, "noto-sans-sc/600SemiBold/NotoSansSC_600SemiBold.ttf"],
] as const;

const styles = {
  /* Characters Inter lacks, such as CJK, fall through to Noto Sans SC. */
  document: { fontFamily: "Inter, Noto Sans SC", fontSize: 8.2, lineHeight: 1.33, color: BODY },
  name: { fontSize: 17, fontWeight: 600, color: INK, lineHeight: 1.2 },
  headline: { fontSize: 9.5 },
  contacts: { fontSize: 8, color: MUTED },
  sectionTitle: {
    fontSize: 7.6,
    fontWeight: 600,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: MUTED,
    borderBottomWidth: 0.6,
    borderBottomColor: LINE,
    paddingBottom: 2,
    marginBottom: 3,
  },
  entryHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  title: { fontWeight: 600, color: INK },
  muted: { color: MUTED },
  links: { fontSize: 7.8, color: MUTED },
  link: { color: INK },
  period: { color: MUTED, fontVariantNumeric: "tabular-nums" },
  point: { flexDirection: "row", gap: 4 },
  tags: { fontSize: 7.8, color: MUTED },
  skillLabel: { width: 92, fontWeight: 600, color: INK },
} satisfies Record<string, Style>;

/* `sectionTitle` heads a section's first entry, so a title never ends a page on its own. */
function CvEntry({ entry, sectionTitle }: { entry: Entry; sectionTitle: string | null }) {
  const heading = sectionTitle !== null && <Text style={styles.sectionTitle}>{sectionTitle}</Text>;
  if (entry.tags !== null && entry.points.length === 0 && entry.role === null) {
    return (
      <View wrap={false}>
        {heading}
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.skillLabel}>{reveal(entry.title)}</Text>
          <Text style={{ flex: 1 }}>{entry.tags.map(reveal).join(" · ")}</Text>
        </View>
      </View>
    );
  }
  const [first, ...rest] = entry.points.map((point, index) => (
    <View key={index} style={styles.point} wrap={false}>
      <Text style={styles.muted}>–</Text>
      <Text style={{ flex: 1 }}>{reveal(point)}</Text>
    </View>
  ));
  return (
    <View style={{ gap: 1.5 }}>
      {/* Nor does an entry's heading: it stays with the first point. */}
      <View style={{ gap: 1.5 }} wrap={false}>
        {heading}
        <View style={styles.entryHead}>
          <Text style={{ flex: 1 }}>
            <Text style={styles.title}>{reveal(entry.title)}</Text>
            {entry.role !== null && <Text style={styles.muted}>{` — ${reveal(entry.role)}`}</Text>}
          </Text>
          {entry.period !== null && <Text style={styles.period}>{reveal(entry.period)}</Text>}
        </View>
        {entry.links.length > 0 && (
          <Text style={styles.links}>
            {entry.links.map((link, index) => (
              <Text key={index}>
                {index > 0 && "  ·  "}
                <Text href={link.href} style={styles.link}>
                  {reveal(link.label)}
                </Text>
              </Text>
            ))}
          </Text>
        )}
        {first}
      </View>
      {rest}
      {entry.tags !== null && <Text style={styles.tags}>{entry.tags.map(reveal).join(" · ")}</Text>}
    </View>
  );
}

export async function renderCvPdf(cv: Cv, locale: Locale): Promise<StoredPdf> {
  const messages = MESSAGES[locale];
  const name = reveal(cv.name);
  const title = `${name} ${messages.title}`;
  const { pdf, layout } = await renderDocumentWithLayout(
    <Document
      title={title}
      author={name}
      lang={locale === "zh" ? "zh-CN" : "en"}
      fonts={FONTS.map(([family, fontWeight, file]) => ({
        family,
        fontWeight,
        src: fileURLToPath(import.meta.resolve(`@expo-google-fonts/${file}`)),
      }))}
      style={styles.document}
    >
      <Page size="A4" margin={{ top: 28, right: 34, bottom: 28, left: 34 }}>
        <View style={{ gap: 8 }}>
          <View style={{ gap: 2 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.headline}>
              {reveal(cv.headline)}
              <Text style={styles.muted}>{` · ${reveal(cv.location)}`}</Text>
            </Text>
            <Text style={styles.contacts}>
              {cv.contacts.map((contact, index) => (
                <Text key={index}>
                  {index > 0 && "    "}
                  <Text href={contact.href}>{reveal(contact.label)}</Text>
                </Text>
              ))}
            </Text>
          </View>
          <View wrap={false}>
            <Text style={styles.sectionTitle}>{messages.summary}</Text>
            <Text>{reveal(cv.summary)}</Text>
          </View>
          {cv.sections.map((section, index) => (
            <View key={index} style={{ gap: 4.5 }}>
              {section.entries.map((entry, entryIndex) => (
                <CvEntry
                  key={entryIndex}
                  entry={entry}
                  sectionTitle={entryIndex === 0 ? reveal(section.title) : null}
                />
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>,
  );
  if (layout.pages.length > MAX_PAGES) {
    throw new Error(
      `The ${locale} PDF runs to ${layout.pages.length} pages; trim the CV to fit ${MAX_PAGES}.`,
    );
  }
  return { filename: `${title}.pdf`, base64: Buffer.from(pdf).toString("base64") };
}
