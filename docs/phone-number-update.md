# Phone Number Update

## Flow

1. Enter new phone number
2. Verify Fayda identity requirement
3. Verify OTP on the new number
4. Submit selfie if policy requires it
5. Submit request

## Required Controls

- Fayda verification
- OTP to new number
- selfie verification when policy requires it
- audit trail

## Planned Backend

- `phone_number_change_requests`

## Planned APIs

- `POST /profile/phone-number-change/request`
- `POST /profile/phone-number-change/verify-fayda`
- `POST /profile/phone-number-change/verify-otp`
- `POST /profile/phone-number-change/submit`
