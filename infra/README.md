# infra

Side services that run next to the portfolio application on the same Coolify server.
Each folder is a separate Coolify resource of type "Docker Compose" pointing at this
repository, so the compose file and its config live under version control.

| Folder   | Coolify resource | Public domain                        |
| -------- | ---------------- | ------------------------------------ |
| `gatus/` | gatus            | https://status.dogancanyildiz.com    |
| `umami/` | umami            | https://analytics.dogancanyildiz.com |

These folders are excluded from the application Docker build context through
`.dockerignore`; the Next.js image never needs them.

Umami generates its own database password and application secret through the
Coolify `SERVICE_PASSWORD_*` magic variables, so no secret is ever committed
here. The website id created inside the Umami dashboard is public by design and
is passed to the application as a Docker build argument.

## Gatus dashboard: public by design

`status.dogancanyildiz.com` has no login. That is a deliberate choice, not an
oversight: a status page is only useful to visitors if they can see it, and
`src/lib/status.ts` already narrows what the site pulls from it down to name,
up/down, 24h uptime and last-check time, none of which is sensitive. What must
never appear in `gatus/config/gatus.yaml` is an internal hostname, container
name, private IP or the port a service actually listens on; endpoint URLs stay
public ones only.

## Alerting

`gatus/config/gatus.yaml` has an `alerting` block: a failure repeats
`failure-threshold` times before it fires, and a resolved incident sends a
follow-up. By default it posts to a generic webhook read from
`GATUS_ALERT_WEBHOOK_URL` (set as a Coolify environment variable on the
`gatus` resource, not committed here); leaving that variable empty disables
alerting entirely; Gatus does not error, it just sends nothing. Point it at a
Discord or Slack incoming webhook URL to get a notification with no other
setup. Prefer email instead, or want a differently worded webhook body? Swap
in the commented `email` block, or replace the active `custom` block with the
second one, in the same file. Only one `custom` provider can be active at a
time (the `alerting:` map takes a single `custom` key), so the second example
is a drop-in replacement, not an additional channel.

Gatus itself runs on the same server it monitors. If that server goes down
entirely, Gatus goes down with it and cannot send the alert. The dashboard
and the webhook alert both cover "the site is up but returning errors" and
similar in-application failures; neither covers "the host is unreachable".
For that, an external monitor on infrastructure you do not control (for
example UptimeRobot or Better Uptime, hitting `https://dogancanyildiz.com`
directly) is the only thing that closes the gap, and setting one up is an
owner action, not something this repository can configure.

## Umami first boot

Umami ships with a built-in `admin` / `umami` login and no environment
variable to change it before first boot (the official image does not support
seeding a different admin password on startup). The first deploy is
therefore briefly reachable at `https://analytics.dogancanyildiz.com` with
that default password. Log in immediately after the first successful deploy
and change it under Settings before doing anything else with the domain
(sharing it, linking to it, adding a second user). The manual checklist at
`docs/plans/handoffs/faz-5-manual-checklist.md` currently stands the domain
up (step 4) before the password change (step 5); the password change is the
first thing to do once the panel is reachable, before adding the website or
sharing the link.
