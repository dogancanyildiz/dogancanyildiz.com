# infra

Side services that run next to the portfolio application on the same Coolify server.
Each folder is a separate Coolify resource of type "Docker Compose" pointing at this
repository, so the compose file and its config live under version control.

| Folder | Coolify resource | Public domain |
|---|---|---|
| `gatus/` | gatus | https://status.dogancanyildiz.com |
| `umami/` | umami | https://analytics.dogancanyildiz.com |

These folders are excluded from the application Docker build context through
`.dockerignore`; the Next.js image never needs them.

Umami generates its own database password and application secret through the
Coolify `SERVICE_PASSWORD_*` magic variables, so no secret is ever committed
here. The website id created inside the Umami dashboard is public by design and
is passed to the application as a Docker build argument.
