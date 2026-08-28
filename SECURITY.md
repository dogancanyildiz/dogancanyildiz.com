# Security policy

This repository holds the source of my personal site, dogancanyildiz.com.
If you find a vulnerability in the site or in this code, I would like to
hear about it.

## Reporting

- Email: me@dogancanyildiz.com
- Or open a private report through GitHub: Security tab, "Report a
  vulnerability" (private vulnerability reporting is enabled).

Please do not open a public issue for security problems.

Include what you found, how to reproduce it and, if you have one, a
suggested fix. I aim to acknowledge reports within 72 hours and to fix
confirmed issues within 14 days. There is no bug bounty; credit in the
changelog is offered if you want it.

## Scope

- The application code in this repository.
- The deployed site at https://dogancanyildiz.com (please keep testing
  non-destructive: no denial of service, no automated scanning of the
  contact endpoint beyond a handful of requests).

Out of scope: third-party services the site depends on (Cloudflare,
Resend, GitHub), report those to the vendor.

## Supported versions

Only the code on `main` is deployed. Older tags are not patched.

The machine-readable version of this policy is served at
https://dogancanyildiz.com/.well-known/security.txt (RFC 9116).
