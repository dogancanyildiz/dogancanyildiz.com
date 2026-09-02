"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  EMAIL_PATTERN,
  HONEYPOT_FIELD,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  type ContactField,
} from "@/lib/contact-validation";

type Status = "idle" | "loading" | "success" | "error";
type FieldErrors = Partial<Record<ContactField, string>>;
type FocusTarget = ContactField | "status" | "alert" | null;

/**
 * Client side ceiling on the request. The server gives itself ten seconds for
 * the mail provider, so fifteen leaves room for its answer to travel back
 * before the form stops waiting.
 */
const REQUEST_TIMEOUT_MS = 15_000;

/** Field order, which is also the order the first error is focused in. */
const FIELDS: ContactField[] = ["name", "email", "topic", "message"];

/**
 * The API answers a 400 with the field that failed and one generic sentence
 * for the alert region. Repeating that sentence under the input would tell a
 * visitor with a rejected address that name, email and message are required,
 * so the text attached to the field comes from the same catalog the client
 * validation uses.
 */
const SERVER_FIELD_ERROR = {
  name: "errorNameInvalid",
  email: "errorEmailInvalid",
  topic: "errorTopicRequired",
  message: "errorMessageInvalid",
} as const satisfies Record<ContactField, string>;

export function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [retrySeconds, setRetrySeconds] = useState(0);
  // The one controlled field. readOnly does nothing to a <select> and
  // disabled would drop it out of the tab order mid request, so holding the
  // value in state is what lets the lock below actually refuse a change:
  // React restores the rendered value whenever an onChange leaves it
  // unchanged, which is exactly what a keyboard driven change has to hit.
  const [topic, setTopic] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Focus can only move after the element carrying the message has rendered.
  // The submit handler parks a target in the ref and bumps the counter; the
  // effect reads it once the new markup is on the page.
  const focusTargetRef = useRef<FocusTarget>(null);
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    const target = focusTargetRef.current;
    if (!target) {
      return;
    }
    focusTargetRef.current = null;
    const targets: Record<Exclude<FocusTarget, null>, HTMLElement | null> = {
      name: nameRef.current,
      email: emailRef.current,
      topic: topicRef.current,
      message: messageRef.current,
      status: statusRef.current,
      alert: alertRef.current,
    };
    targets[target]?.focus();
  }, [focusTick]);

  function requestFocus(target: FocusTarget) {
    focusTargetRef.current = target;
    setFocusTick((tick) => tick + 1);
  }

  // Counts the 429 window down so the button can say how long the wait is.
  useEffect(() => {
    if (retrySeconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRetrySeconds((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retrySeconds]);

  function validate(values: Record<ContactField, string>): FieldErrors {
    const errors: FieldErrors = {};
    if (!values.name.trim()) {
      errors.name = t("errorNameRequired");
    }
    const email = values.email.trim();
    if (!email) {
      errors.email = t("errorEmailRequired");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = t("errorEmailInvalid");
    }
    if (!values.topic.trim()) {
      errors.topic = t("errorTopicRequired");
    }
    if (!values.message.trim()) {
      errors.message = t("errorMessageRequired");
    }
    return errors;
  }

  // Sync on purpose: React does not observe the promise an async submit
  // handler returns, so a rejection escaping it would surface only as an
  // unhandled rejection and leave the form stuck on "loading".
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading" || retrySeconds > 0) {
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const values: Record<ContactField, string> = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      topic: String(formData.get("topic") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    // The form carries noValidate, so this is the only validation pass and it
    // speaks the language of the site rather than the language of the browser.
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(t("errorFields"));
      setStatus("error");
      requestFocus(FIELDS.find((field) => errors[field]) ?? "alert");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setFieldErrors({});

    const payload = {
      ...values,
      // Posted rather than short circuited here: a bot that can tell the
      // two apart is a bot that can tune around the field.
      [HONEYPOT_FIELD]: String(formData.get(HONEYPOT_FIELD) ?? ""),
    };

    submitRequest(form, payload).catch(() => {
      // submitRequest already turns a failed request into the error state;
      // this only covers a throw from the state or translation calls around
      // it, which would otherwise leave the button spinning forever.
      setErrorMessage(t("error"));
      setStatus("error");
      requestFocus("alert");
    });
  }

  async function submitRequest(
    form: HTMLFormElement,
    payload: Record<string, string>
  ) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Locale": locale },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        field?: ContactField;
      };

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After"));
        setRetrySeconds(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.ceil(retryAfter)
            : 60
        );
        setErrorMessage(data.error || t("error"));
        setStatus("error");
        requestFocus("alert");
        return;
      }

      if (!res.ok) {
        const message = data.error || t("error");
        setErrorMessage(message);
        if (data.field && FIELDS.includes(data.field)) {
          setFieldErrors({ [data.field]: t(SERVER_FIELD_ERROR[data.field]) });
        }
        setStatus("error");
        requestFocus(data.field ?? "alert");
        return;
      }

      setStatus("success");
      requestFocus("status");
      form.reset();
      // form.reset() puts the uncontrolled fields back; the controlled one
      // takes its value from state and has to be cleared alongside them.
      setTopic("");
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      setErrorMessage(timedOut ? t("errorTimeout") : t("error"));
      setStatus("error");
      requestFocus("alert");
    }
  }

  const busy = status === "loading";
  // Everything that would otherwise be disabled: the request is in flight, or
  // the 429 window has not run out yet.
  const locked = busy || retrySeconds > 0;
  const errorId = (field: ContactField) => `contact-${field}-error`;
  const describedBy = (field: ContactField) =>
    fieldErrors[field] ? errorId(field) : undefined;
  // readOnly rather than disabled: a disabled control drops out of the tab
  // order and takes the focus with it while the request is in flight.
  const lock = { readOnly: busy, "aria-disabled": busy || undefined };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-2xl space-y-6"
    >
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          ref={nameRef}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          required
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          {...lock}
        />
        {fieldErrors.name && (
          <p id={errorId("name")} className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          ref={emailRef}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          required
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          {...lock}
        />
        {fieldErrors.email && (
          <p id={errorId("email")} className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="topic">{t("topic")}</Label>
        <NativeSelect
          id="topic"
          name="topic"
          ref={topicRef}
          value={topic}
          onChange={(event) => {
            // The lock, in the one form it can take on a select. Every other
            // field is readOnly while the request is in flight; ignoring the
            // change here makes React put the previous option back.
            if (busy) return;
            setTopic(event.target.value);
          }}
          required
          aria-invalid={fieldErrors.topic ? true : undefined}
          aria-describedby={describedBy("topic")}
          aria-disabled={busy || undefined}
        >
          <option value="">{t("topicPlaceholder")}</option>
          <option value="web">{t("topicWeb")}</option>
          <option value="devops">{t("topicDevops")}</option>
          <option value="security">{t("topicSecurity")}</option>
          <option value="other">{t("topicOther")}</option>
        </NativeSelect>
        {fieldErrors.topic && (
          <p id={errorId("topic")} className="text-sm text-destructive">
            {fieldErrors.topic}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea
          id="message"
          name="message"
          ref={messageRef}
          placeholder={t("messagePlaceholder")}
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          required
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={describedBy("message")}
          {...lock}
        />
        {fieldErrors.message && (
          <p id={errorId("message")} className="text-sm text-destructive">
            {fieldErrors.message}
          </p>
        )}
      </div>
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <Label htmlFor={HONEYPOT_FIELD}>{t("honeypotLabel")}</Label>
        <Input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {/* Both live regions stay mounted, so a screen reader is already
          watching them when the text arrives; a region that appears together
          with its message is often missed. role=status is polite for progress
          and success, role=alert is assertive for the failure path. */}
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          status === "success"
            ? "rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
            : "sr-only"
        }
      >
        {busy ? t("sending") : status === "success" ? t("success") : ""}
      </div>
      <div
        ref={alertRef}
        tabIndex={-1}
        role="alert"
        className={
          status === "error"
            ? "rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            : "sr-only"
        }
      >
        {status === "error" ? errorMessage : ""}
      </div>
      {/* aria-disabled rather than disabled, for the same reason as the
          inputs: a keyboard submit leaves the focus on this button, and
          disabling it mid request would drop that focus to the document.
          The submit handler swallows the extra submit instead. */}
      <Button
        type="submit"
        size="lg"
        aria-disabled={locked || undefined}
        aria-busy={status === "loading"}
        className="aria-disabled:opacity-50"
      >
        {busy
          ? t("sending")
          : retrySeconds > 0
            ? t("retryAfter", { seconds: retrySeconds })
            : t("submit")}
      </Button>
    </form>
  );
}
