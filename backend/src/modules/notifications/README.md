# Notifications Module

Notification persistence, read APIs, and delivery-provider abstraction belong here.

Current behavior:
- stores in-app notification records
- marks read state
- supports member and staff notifications
- uses centralized config for outbound channel dispatch
- supports real SMTP email delivery for reminder campaigns
- keeps Firebase as an explicit future integration point instead of hiding fake success
