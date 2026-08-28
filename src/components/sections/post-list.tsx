import { ArrowUpRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ContentEntryBody,
  ContentEntryIndex,
} from "@/components/ui/content-entry";
import type { PostCardData } from "@/lib/content";

interface PostListProps {
  posts: PostCardData[];
  /** h2 when the list sits directly under the page h1, h3 under a section h2. */
  headingLevel?: "h2" | "h3";
}

/**
 * Server rendered on purpose: nothing here reacts to the user, and the entrance
 * animation it used to run wrote `opacity: 0` into the prerendered HTML. Card
 * links opt out of prefetching so a long listing does not pull an RSC payload
 * per row as it scrolls into view.
 */
export async function PostList({ posts, headingLevel = "h2" }: PostListProps) {
  const Heading = headingLevel;
  const t = await getTranslations("blog");
  const format = await getFormatter();

  return (
    <ul className="content-stack">
      {posts.map((post, index) => (
        <li key={post.slug} className="content-entry group">
          <ContentEntryIndex index={index} />

          <ContentEntryBody>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag-pill">
                <time dateTime={post.date}>
                  {format.dateTime(new Date(post.date), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                </time>
              </span>
              <span className="tag-pill">
                {t("readingTime", { minutes: post.readingTime })}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Heading className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                <Link
                  href={post.href}
                  prefetch={false}
                  className="after:absolute after:inset-0 text-foreground no-underline transition-colors group-hover:text-primary"
                >
                  {post.title}
                </Link>
              </Heading>
              <ArrowUpRight className="entry-arrow mt-1" aria-hidden="true" />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {post.summary}
            </p>

            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2 pt-1">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <span className="tag-pill normal-case tracking-normal">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </ContentEntryBody>
        </li>
      ))}
    </ul>
  );
}
