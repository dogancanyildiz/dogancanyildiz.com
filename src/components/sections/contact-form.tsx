"use client";

import { useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fadeUp } from "@/lib/motion";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (formData.get("website")) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("error"));
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(t("error"));
    }
  }

  return (
    <m.form
      variants={variants}
      initial="hidden"
      animate="show"
      custom={0}
      onSubmit={handleSubmit}
      className="surface-panel relative mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8"
    >
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t("namePlaceholder")}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea
          id="message"
          name="message"
          placeholder={t("messagePlaceholder")}
          rows={5}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <Label htmlFor="website">{t("honeypotLabel")}</Label>
        <Input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {/* The status paragraphs are conditionally rendered, so the role has to
          sit on the element that appears: role=alert is assertive for the
          failure path, role=status is polite for the success path. */}
      {status === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}
      {status === "success" && (
        <p
          role="status"
          className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          {t("success")}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? t("sending") : t("submit")}
      </Button>
    </m.form>
  );
}
