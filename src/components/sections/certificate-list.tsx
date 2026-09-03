import { getFormatter, getTranslations } from "next-intl/server";
import { CredentialPreview } from "@/components/sections/credential-preview";
import { certificateGroupsFor } from "@/content/profile";
import type { CertificateEntry } from "@/content/profile";
import { outboundEvent } from "@/lib/analytics-events";
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

/** Keeps the keyword line one sentence rather than a comma list. */
const KEYWORD_SEPARATOR = " · ";

/**
 * Certificates and badges, grouped under the organization that issued them.
 *
 * One link per row, and it is the "Verify" link rather than the name or the
 * artwork. The name is the claim and the link is the way to check it, so
 * making the name itself a link would tint the row's only piece of substance
 * and give a screen reader two ways to reach the same place. The visible word
 * stays short and repeats down the list, so each link takes an aria label
 * naming its credential: a reader pulling up a list of links gets twelve
 * distinct entries rather than twelve identical ones. The label opens with the
 * visible word, which is what SC 2.5.3 asks of it.
 *
 * The artwork is the row's other control, and a different one: it opens the
 * same image large enough to read rather than leaving the page. See
 * credential-preview.tsx for why it is a button at all.
 *
 * Under the name sits one muted line of the issuer's own skill tags. A course
 * title is not self-explanatory to anyone outside its track, and the tags are
 * the shortest honest answer to "what was actually assessed".
 *
 * The issuer is printed once, as the group heading, and not again on every
 * row; the row's meta line carries only the issue month. Brand names keep
 * their own casing: the uppercase transform of .meta-label would turn a
 * Turkish reader's "Cisco" into "CİSCO" with a dotted capital I.
 *
 * Rows run in two columns from md up, on the same grid rhythm as the skills
 * section. The separator is a border-t on every row rather than a divide-y on
 * the list: divide-y draws between siblings in source order, which in a
 * two column grid puts a line down the middle of a row and none above the
 * right hand column. A top border sits on the grid row's own edge, so both
 * columns get the same hairline in the same place, and the list stops after
 * its last row instead of trailing a rule under half of it.
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
          <ul className="grid gap-x-8 md:grid-cols-2">
            {group.entries.map((entry) => (
              <li
                key={entry.name}
                className="flex items-start gap-4 border-t border-border py-4"
              >
                {entry.badge ? (
                  <CredentialPreview
                    name={entry.name}
                    src={entry.badge.src}
                    width={entry.badge.width}
                    height={entry.badge.height}
                    alt={badgeAlt(entry)}
                    enlargeLabel={t("certificateEnlarge", { name: entry.name })}
                    closeLabel={t("certificatePreviewClose")}
                    verifyUrl={entry.verifyUrl}
                    verifyText={t("certificateVerify")}
                    verifyLabel={t("certificateVerifyLabel", {
                      name: entry.name,
                    })}
                  />
                ) : (
                  /* The slot keeps its width whether or not there is artwork,
                     so the names stay aligned down the whole section. */
                  <div className="h-16 w-24 shrink-0" />
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{entry.name}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {entry.keywords[locale].join(KEYWORD_SEPARATOR)}
                  </p>
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
                      {...outboundEvent(entry.verifyUrl)}
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
