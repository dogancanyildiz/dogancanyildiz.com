"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PostCardData } from "@/lib/content";
import { fadeUp } from "@/lib/motion";

interface PostListProps {
  posts: PostCardData[];
}

export function PostList({ posts }: PostListProps) {
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
          <h2 className="mt-2 text-2xl leading-snug">
            <Link href={post.href} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {post.summary}
          </p>
        </m.li>
      ))}
    </ul>
  );
}
