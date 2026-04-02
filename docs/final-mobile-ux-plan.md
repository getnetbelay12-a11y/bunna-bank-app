# Final Mobile UX Plan

## Visually Refactored Screens

- Home
- Payments
- Transactions
- My Bank
- Profile
- Notifications
- My Loans
- Help & Support
- Security Settings

## Runtime Errors Fixed

- Fixed root tab pages that were rendered inside the main shell without their own `Material` surface.
- Fixed pages that contained `ListTile` and other Material-dependent widgets without a nearby `Material` ancestor.
- Preserved `Scaffold + AppBar` for child/detail pages and ensured active tab pages render inside `Material`.

## Widget Trees Repaired

The main repair pattern was:

- root shell keeps the main `Scaffold`
- active tab pages now render inside `Material(color: ...)`
- detail pages use `Scaffold`
- form/detail pages use `SafeArea`
- long pages use `SingleChildScrollView` or `ListView`

## Home Changes

- kept the familiar CBE Bank structure close to the reference app
- retained welcome header
- retained a dominant balance card
- retained a quick actions icon grid
- retained a banner/service area
- retained a small recent activity preview
- reduced clutter by removing extra dashboard-style summary tiles
- kept urgent reminders small and conditional

## Payments Changes

- removed oversized pill-like text treatment
- replaced awkward action banners with medium-size payment action cards
- rebuilt payment categories into a proper banking list layout with icons and chevrons
- kept the page compact and usable

## New Feature Placement Without Clutter

- `Home`: urgent reminders only
- `Transactions`: reminders and transaction history
- `My Bank`: Auto Payment, ATM Order, Loan Tracker, Add Member On Account, shareholder services
- `Profile`: security, account lock, phone update, KYC, support, terms, logout

## Familiar Style

The final app keeps:

- dark blue primary banking surfaces
- yellow brand accents
- white/light content sections
- light blue only for small `New` chips and new-feature highlight banners
