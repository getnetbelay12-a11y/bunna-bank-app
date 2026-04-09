# Notifications Module

Notification persistence, read APIs, and delivery-provider abstraction belong here.

Current behavior:
- stores in-app notification records
- marks read state
- supports member and staff notifications
- uses centralized config for outbound channel dispatch
- supports `log` and `generic_http` provider paths now
- keeps Firebase and SMTP as explicit future integration points instead of hiding fake success
