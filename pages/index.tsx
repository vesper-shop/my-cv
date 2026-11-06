import { Form, action, useForm } from "@void/react";
import {
  ArrowRight,
  Globe,
  Languages,
  LoaderCircle,
  Lock,
  Mail,
  Moon,
  Phone,
  Printer,
  Sun,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import {
  siCloudflare,
  siCloudflareworkers,
  siCplusplus,
  siDocker,
  siDrizzle,
  siElectron,
  siExpo,
  siGithubactions,
  siGo,
  siHono,
  siJavascript,
  siModelcontextprotocol,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siSolid,
  siSpringboot,
  siSqlite,
  siSvelte,
  siTailwindcss,
  siTypescript,
  siVuedotjs,
  type SimpleIcon,
} from "simple-icons";
import type { ReactNode, SVGProps } from "react";
import { useFormStatus } from "react-dom";
import type { EntryView, LinkView, Rich } from "../lib/cv";
import { MESSAGES, type Messages } from "../lib/i18n";
import type { Props } from "./index.server";
import "./style.css";

/** Stand-in glyphs for a hidden span; the server sends only its width, never the text. */
const FILLER =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ".repeat(8);

function RichText({ value }: { value: Rich }) {
  return value.map((segment, index) =>
    segment.kind === "hidden" ? (
      <span key={index} className="redacted" role="img" aria-label="hidden">
        {FILLER.slice(0, segment.width)}
      </span>
    ) : segment.sensitive ? (
      <span key={index} className="revealed">
        {segment.text}
      </span>
    ) : (
      segment.text
    ),
  );
}

/** Sections rise in one after another; `order` is a section's place on the page. */
function rise(order: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: order * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function GitHubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function XMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.8 2.3h7l4.8 6.4 5.6-6.4Zm-1.2 17.9h1.9L6.9 4.2h-2l12.1 16Z" />
    </svg>
  );
}

/** The icon for a contact, read from its link; a withheld link shows a lock, revealing nothing. */
function ContactIcon({ href }: { href: string | null }) {
  const className = "size-3.5 shrink-0";
  if (href === null) return <Lock className={className} aria-hidden />;
  if (href.startsWith("mailto:")) return <Mail className={className} aria-hidden />;
  if (href.startsWith("tel:")) return <Phone className={className} aria-hidden />;
  const host = new URL(href).hostname;
  if (host === "github.com") return <GitHubMark className={className} aria-hidden />;
  if (host === "x.com") return <XMark className={className} aria-hidden />;
  return <Globe className={className} aria-hidden />;
}

/** Brand marks for skill tags, keyed by the tag text; tags without one show text only. */
const SKILL_ICONS: Record<string, SimpleIcon> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Java: siOpenjdk,
  Python: siPython,
  Go: siGo,
  "C++": siCplusplus,
  React: siReact,
  "React Native": siReact,
  "Next.js": siNextdotjs,
  "Vue 3": siVuedotjs,
  SvelteKit: siSvelte,
  SolidJS: siSolid,
  Electron: siElectron,
  Expo: siExpo,
  "Tailwind CSS": siTailwindcss,
  "Node.js": siNodedotjs,
  Hono: siHono,
  "Spring Boot": siSpringboot,
  PostgreSQL: siPostgresql,
  MySQL: siMysql,
  MongoDB: siMongodb,
  SQLite: siSqlite,
  "Cloudflare D1": siCloudflare,
  "Drizzle ORM": siDrizzle,
  Docker: siDocker,
  Nginx: siNginx,
  "Cloudflare Workers": siCloudflareworkers,
  R2: siCloudflare,
  KV: siCloudflare,
  "CI/CD": siGithubactions,
  PyTorch: siPytorch,
  MCP: siModelcontextprotocol,
};

function SkillIcon({ tag }: { tag: Rich }) {
  const name = tag.map((segment) => (segment.kind === "text" ? segment.text : "")).join("");
  if (!Object.hasOwn(SKILL_ICONS, name)) return null;
  const icon = SKILL_ICONS[name]!;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 shrink-0" aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}

function Link({ link }: { link: LinkView }) {
  return link.href === null ? (
    <RichText value={link.label} />
  ) : (
    <a href={link.href} target="_blank" rel="noreferrer">
      <RichText value={link.label} />
    </a>
  );
}

function Section({
  title,
  order,
  children,
}: {
  title: ReactNode;
  order: number;
  children: ReactNode;
}) {
  return (
    <motion.section className="grid grid-cols-[minmax(0,1fr)] gap-5" {...rise(order)}>
      <h2 className="section-title">{title}</h2>
      {children}
    </motion.section>
  );
}

function Entry({ entry }: { entry: EntryView }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 flex-1 font-semibold text-ink">
          <RichText value={entry.title} />
        </h3>
        {entry.period && (
          <span className="shrink-0 text-sm whitespace-nowrap text-muted tabular-nums">
            <RichText value={entry.period} />
          </span>
        )}
      </div>
      {entry.role && (
        <p className="text-sm text-muted">
          <RichText value={entry.role} />
        </p>
      )}
      {entry.links.length > 0 && (
        <p className="flex flex-wrap gap-x-4 text-sm">
          {entry.links.map((link, index) => (
            <Link key={index} link={link} />
          ))}
        </p>
      )}
      {entry.points.length > 0 && (
        <ul className="points">
          {entry.points.map((point, index) => (
            <li key={index}>
              <RichText value={point} />
            </li>
          ))}
        </ul>
      )}
      {entry.tags && (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {entry.tags.map((tag, index) => (
            <li key={index} className="tag">
              <SkillIcon tag={tag} />
              <RichText value={tag} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function UnlockButton({ messages }: { messages: Messages }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="code-submit"
      aria-label={pending ? messages.checking : messages.unlock}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <ArrowRight className="size-4" aria-hidden />
      )}
    </button>
  );
}

/** Sections a locked reader sees in full; the rest sit blurred behind the lock. */
const PREVIEW_SECTIONS = 1;

function UnlockForm({ note, messages }: { note: Rich; messages: Messages }) {
  const form = useForm("/?unlock", { code: "" });
  return (
    <div className="unlock-panel grid w-full max-w-md content-start justify-items-center gap-4 text-center">
      <motion.span
        className="lock-badge"
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Lock className="size-5" aria-hidden />
      </motion.span>
      <div className="grid gap-1">
        <p className="text-lg font-semibold text-ink">{messages.hireTitle}</p>
        <p className="text-sm text-muted">
          <RichText value={note} />
        </p>
      </div>
      <Form form={form} className="grid w-full gap-1.5">
        <div className="code-field">
          <input
            name="code"
            type="password"
            aria-invalid={Boolean(form.errors.code)}
            autoComplete="off"
            placeholder={messages.codePlaceholder}
            aria-label={messages.codePlaceholder}
            value={form.data.code}
            onChange={(event) => form.setData("code", event.target.value)}
          />
          <UnlockButton messages={messages} />
        </div>
        {form.errors.code && <p className="text-sm text-danger">{form.errors.code}</p>}
      </Form>
    </div>
  );
}

function SectionList({ sections, from }: { sections: Props["cv"]["sections"]; from: number }) {
  return sections.map((section, index) => (
    <Section key={index} order={from + index} title={<RichText value={section.title} />}>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-7">
        {section.entries.map((entry, entryIndex) => (
          <Entry key={entryIndex} entry={entry} />
        ))}
      </ul>
    </Section>
  ));
}

export default function CvPage({ access, locale, theme, cv }: Props) {
  const messages = MESSAGES[locale];
  return (
    <MotionConfig reducedMotion="user">
      <div className="theme" data-theme={theme}>
        <nav className="mx-auto flex max-w-2xl justify-end gap-1 px-6 pt-6 print:hidden">
          <button type="button" className="toolbar-button" onClick={() => print()}>
            <Printer className="size-4" aria-hidden />
            {messages.exportPdf}
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() =>
              void action("/?locale", { data: { locale: locale === "en" ? "zh" : "en" } })
            }
          >
            <Languages className="size-4" aria-hidden />
            {messages.switchLocale}
          </button>
          <button
            type="button"
            className="toolbar-button"
            title={messages.toggleTheme}
            aria-label={messages.toggleTheme}
            onClick={() => {
              const shownDark =
                theme === "system"
                  ? matchMedia("(prefers-color-scheme: dark)").matches
                  : theme === "dark";
              void action("/?theme", { data: { theme: shownDark ? "light" : "dark" } });
            }}
          >
            <Moon className="when-light size-4" aria-hidden />
            <Sun className="when-dark size-4" aria-hidden />
          </button>
        </nav>

        <main
          className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)] gap-12 px-6 pt-10 pb-24"
          lang={locale}
        >
          <motion.header className="grid gap-3" {...rise(0)}>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              <RichText value={cv.name} />
            </h1>
            <p className="text-lg text-body">
              <RichText value={cv.headline} />
              <span className="text-muted">
                {" · "}
                <RichText value={cv.location} />
              </span>
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
              {cv.contacts.map((contact, index) => (
                <li key={index} className="flex items-center gap-1.5">
                  <ContactIcon href={contact.href} />
                  <Link link={contact} />
                </li>
              ))}
            </ul>
            {access !== null && (
              <p className="flex items-center gap-2 text-sm text-muted print:hidden">
                <span className="unlocked-dot" aria-hidden />
                {messages.unlockedAs(access)}
                <span aria-hidden>·</span>
                <button type="button" className="text-link" onClick={() => void action("/?lock")}>
                  {messages.hide}
                </button>
              </p>
            )}
          </motion.header>

          <Section title={messages.summary} order={1}>
            <p className="leading-relaxed text-body">
              <RichText value={cv.summary} />
            </p>
          </Section>

          {access === null ? (
            <>
              <SectionList sections={cv.sections.slice(0, PREVIEW_SECTIONS)} from={2} />
              <div className="locked-region">
                <div className="locked-content" aria-hidden inert>
                  <SectionList
                    sections={cv.sections.slice(PREVIEW_SECTIONS)}
                    from={2 + PREVIEW_SECTIONS}
                  />
                </div>
                <div className="locked-overlay">
                  <UnlockForm note={cv.note} messages={messages} />
                </div>
              </div>
            </>
          ) : (
            <SectionList sections={cv.sections} from={2} />
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
