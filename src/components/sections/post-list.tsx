"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PostCardData } from "@/lib/content";
import { fadeUp } from "@/lib/motion";

interface PostListProps {
  posts: PostCardData[];
  /** h2 when the list sits directly under the page h1, h3 under a section h2. */
  headingLevel?: "h2" | "h3";
}

export function PostList({ posts, headingLevel = "h2" }: PostListProps) {
  const Heading = headingLevel;
  const t = useTranslations("blog");
  const format = useFormatter();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <ul className="divide-y divide-border border-y border-border">
      {posts.map((post, index) => (
        <m.li
          key={post.slug}
          variants={variants}
          initial="hidden"
          animate="show"
          custom={index}
          className="relative py-6"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <time dateTime={post.date}>
              {format.dateTime(new Date(post.date), {
                dateStyle: "long",
                timeZone: "UTC",
              })}
            </time>
            <span aria-hidden="true"> · </span>
            {t("readingTime", { minutes: post.readingTime })}
          </p>
          <Heading className="mt-2 text-2xl leading-snug">
            <Link href={post.href} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </Heading>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {post.summary}
          </p>
        </m.li>
      ))}
    </ul>
  );
}
