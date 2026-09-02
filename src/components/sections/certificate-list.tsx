import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { certificateGroupsFor } from "@/content/profile";
import type { CertificateEntry } from "@/content/profile";
import type { Locale } from "@/lib/content";

/**
 * An issue date is a calendar day printed on a record, not an instant. Without
 * a fixed zone a visitor west of UTC reads 2026-02-02 as January, so the day
 * is pinned to UTC and only the month and year are shown: the exact day of a
 * course completion is noise next to the year it happened.
 */
const ISSUED_FORMAT = {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
} as const;

/**
 * Certificates and badges, grouped under the organization that issued them.
 *
 * One link per row, and it is the "Verify" link rather than the name or the
 * artwork. The name is the claim and the link is the way to check it, so
 * making the name itself a link would tint the row's only piece of substance
 * and give a screen reader two ways to reach the same place; the badge image
 * is the issuer's artwork, not a second navigation affordance. The visible
 * word stays short and repeats down the list, so each link takes an aria
 * label naming its credential: a reader pulling up a list of links gets
 * twelve distinct entries rather than twelve identical ones. The label
 * opens with the visible word, which is what SC 2.5.3 asks of it.
 *
 * The issuer is printed once, as the group heading, and not again on every
 * row; the row's meta line carries only the issue month. Brand names keep
 * their own casing: the uppercase transform of .meta-label would turn a
 * Turkish reader's "Cisco" into "CİSCO" with a dotted capital I.
 */
export async function CertificateList({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about" });
  const format = await getFormatter({ locale });
  const groups = certificateGroupsFor(locale);

  if (groups.length === 0) {
    return <p className="section-copy">{t("emptyList")}</p>;
  }

  const badgeAlt = (entry: CertificateEntry): string =>
    entry.badge?.kind === "certificate"
      ? t("certificateImageAlt", { name: entry.name })
      : t("certificateBadgeAlt", { name: entry.name });

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="meta-label normal-case tracking-normal">
            {group.issuer}
          </h3>
          <ul className="divide-y divide-border">
            {group.entries.map((entry) => (
              <li
                key={entry.name}
                className="flex items-start gap-4 py-4 first:pt-0"
              >
                {/* The slot keeps its width whether or not there is artwork,
                    so the names stay on one line down the whole section. */}
                <div className="flex h-16 w-24 shrink-0 items-center justify-center">
                  {entry.badge ? (
                    <Image
                      src={entry.badge.src}
                      alt={badgeAlt(entry)}
                      width={entry.badge.width}
                      height={entry.badge.height}
                      // Badges are unframed on purpose: each PNG carries its
                      // own silhouette, and a border would draw a box around
                      // shapes that are not boxes. The landscape certificate
                      // gets the same 64px slot and letterboxes inside it.
                      className="h-16 w-auto max-w-full object-contain"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{entry.name}</p>
                  {entry.issued ? (
                    <p className="meta-label">
                      <time dateTime={entry.issued}>
                        {format.dateTime(
                          new Date(`${entry.issued}T00:00:00Z`),
                          ISSUED_FORMAT
                        )}
                      </time>
                    </p>
                  ) : null}
                  {entry.credentialId ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      {t("certificateCredentialId", { id: entry.credentialId })}
                    </p>
                  ) : null}
                  {entry.verifyUrl ? (
                    <a
                      href={entry.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("certificateVerifyLabel", {
                        name: entry.name,
                      })}
                      className="tap-target inline-flex items-center text-sm text-primary underline underline-offset-4"
                    >
                      {t("certificateVerify")}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
