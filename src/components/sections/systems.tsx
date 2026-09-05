import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { LiveStatus } from "@/components/sections/live-status";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { buildInfo, commitUrl, formatBuildSha } from "@/lib/build-info";
import { getLatestRelease, RELEASES_URL } from "@/lib/release-info";

/**
 * Hard-coded on purpose. This line names technologies, never machines: no
 * hostname, no port, no internal service address, no IP.
 */
const STACK = [
  "Next.js",
  "Docker",
  "Coolify",
  "Traefik",
  "Cloudflare",
] as const;

/**
 * Three of the four cells are build-time data the deploy itself produced. The
 * fourth reads Uptime Kuma's public status page JSON, on the server, through
 * a 60 second ISR cache (src/lib/status-page.ts). The earlier "no third party
 * data here" rule was about Kuma's undocumented internals, so the parse is
 * schema validated and every failure, including an unreachable host during
 * `next build`, drops the cell back to the plain status page link.
 */

/**
 * The deploy timestamp is a UTC instant from CI / Coolify.
 * `timeZoneName: "short"` spells that out for every visitor instead of
 * silently showing a time that looks local but is not.
 */
const DATE_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  // Istanbul time: the owner and most visitors read the clock in TRT, and the
  // zone name stays on the value so nobody has to guess.
  timeZone: "Europe/Istanbul",
  timeZoneName: "short",
} as const;

/**
 * Public status page (Uptime Kuma), a build-time public value like the other
 * NEXT_PUBLIC_* variables: the page is prerendered, so a runtime value could
 * never reach it. Only an https URL is accepted; anything else hides the row
 * rather than shipping a broken or downgraded link.
 */
function statusPageUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_STATUS_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function SystemsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Renders a plain section, not a PageSection: the home page already wraps
 * every section in one PageSection (src/app/[lang]/page.tsx), so opening a
 * second one here would double the vertical rhythm and horizontal padding.
 */
export async function Systems() {
  const [t, tA11y, format] = await Promise.all([
    getTranslations("systems"),
    getTranslations("a11y"),
    getFormatter(),
  ]);
  const newTabHint = tA11y("opensInNewTab");
  const buildSha = buildInfo.sha ? formatBuildSha(buildInfo.sha) : null;
  const parsedBuildDate = buildInfo.date.trim()
    ? new Date(buildInfo.date)
    : null;
  const buildDate =
    parsedBuildDate && !Number.isNaN(parsedBuildDate.getTime())
      ? parsedBuildDate
      : null;
  const statusUrl = statusPageUrl();
  // The live version comes from GitHub Releases; package.json is one release
  // behind on main by construction (see src/lib/release-info.ts).
  const release = await getLatestRelease();
  const version = release?.version ?? buildInfo.version;
  const releaseUrl = release?.url ?? RELEASES_URL;

  return (
    <div className="space-y-8">
      <PageHeader
        as="h2"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="surface-panel space-y-6 p-6">
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SystemsField label={t("deployLabel")}>
            {buildDate ? format.dateTime(buildDate, DATE_FORMAT) : t("noData")}
          </SystemsField>

          <SystemsField label={t("releaseLabel")}>
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t("releaseTitle")}
                className="underline decoration-dotted underline-offset-4 hover:text-muted-foreground"
              >
                v{version}
                <NewTabHint text={newTabHint} />
              </a>
              {buildSha ? (
                <a
                  href={commitUrl(buildInfo.sha)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("commitTitle")}
                  className="font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                >
                  {/* The hash is what a sighted reader sees; the accessible
                      name is the sr-only span, which spells out what it is a
                      hash of. */}
                  <span aria-hidden="true">{buildSha}</span>
                  <span className="sr-only">
                    {t("commitAria", { sha: buildSha })}
                  </span>
                  <NewTabHint text={newTabHint} />
                </a>
              ) : null}
            </span>
          </SystemsField>

          <SystemsField label={t("statusLabel")}>
            {statusUrl ? <LiveStatus href={statusUrl} /> : t("noData")}
          </SystemsField>

          <SystemsField label={t("stackLabel")}>
            {STACK.join(" · ")}
          </SystemsField>
        </dl>
      </div>
    </div>
  );
}
