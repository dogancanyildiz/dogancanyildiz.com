"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PostCardData } from "@/lib/content";
import { fadeUp, MOTION_ITEM_CLASS } from "@/lib/motion";

interface PostListProps {
  posts: PostCardData[];
  /** h2 when the list sits directly under the page h1, h3 under a section h2. */
  headingLevel?: "h2" | "h3";
}

export function PostList({
  posts,
  headingLevel = "h2",
}: PostListProps) {
  const Heading = headingLevel;
  const t = useTranslations("blog");
  const format = useFormatter();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <ul className="content-stack">
      {posts.map((post, index) => (
        <m.li
          key={post.slug}
          variants={variants}
          initial="hidden"
          animate="show"
          custom={index}
          className={`content-entry group list-row ${MOTION_ITEM_CLASS}`}
        >
          <span className="content-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0 space-y-3">
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
                  className="after:absolute after:inset-0 text-foreground no-underline transition-colors group-hover:text-primary"
                >
                  {post.title}
                </Link>
              </Heading>
              <ArrowUpRight
                className="entry-arrow mt-1"
                aria-hidden="true"
              />
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
          </div>
        </m.li>
      ))}
    </ul>
  );
}
