# Security and privacy boundary

## Deliberate boundary

HearthPlan is a static, client-only document. It has no server-side persistence, authentication, network calls, cookies, third-party scripts, external fonts, analytics, or credentials. The original server-backed prototype is not modified and is not part of this directory.

The only persistence mechanism is browser `localStorage`. The application treats that storage as untrusted: it validates the schema on read, caps serialized size, limits collection counts, bounds string lengths, ignores unknown fields, and falls back to a clean plan if data is malformed. Import validates the full candidate before committing it.

## Data handling

Local state can be read by code running in the same browser origin. Exported backups are unencrypted JSON and can contain household contact details entered by the user. Users should keep exports private and should not enter SSNs, diagnoses, prescription names, insurance numbers, passwords, or other highly sensitive data.

This tool does not provide emergency notification, monitoring, dispatch, medical guidance, legal guidance, or guaranteed availability. Users must rely on official local guidance and emergency services.

## Operational limitations

A public host must still be configured to serve this directory with HTTPS and an appropriate security policy. This static edition does not claim CSP headers, origin isolation, backups, account recovery, multi-device sync, access control, or server-side audit logging. Those are intentionally absent, not silently provided by the client code.

Before any public launch, independently verify the hosting headers, HTTPS, caching behavior, directory scope, and that no server routes or assets are added that change this client-only boundary.
