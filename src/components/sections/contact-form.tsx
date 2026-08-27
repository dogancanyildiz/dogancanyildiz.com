"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const t = useTranslations();
  const locale = useLocale();
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
          subject: formData.get("subject") || "Portfolio contact",
          message: formData.get("message"),
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("form.errorGeneric"));
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(t("form.errorNetwork"));
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="surface-panel relative mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8"
    >
      <div className="space-y-2">
        <span className="eyebrow">{t("form.introTitle")}</span>
        <p className="text-sm leading-7 text-muted-foreground">
          {t("form.introBody")}
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t("form.placeholderName")}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("form.placeholderEmail")}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject">{t("form.subject")}</Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          placeholder={t("form.placeholderSubject")}
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">{t("form.message")}</Label>
        <Textarea
          id="message"
          name="message"
          placeholder={t("form.placeholderMessage")}
          rows={5}
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" type="text" tabIndex={-1} />
      </div>
      {status === "error" && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      {status === "success" && (
        <p className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {t("form.success")}
        </p>
      )}
      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? t("form.sending") : t("form.send")}
      </Button>
    </motion.form>
  );
}
