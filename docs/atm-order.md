# ATM Order

## Goal

Allow the customer to request ATM or branch cash pickup before visiting.

## Customer Actions

- create order
- choose amount
- choose branch or ATM
- choose pickup time
- track order status

## Planned Statuses

- submitted
- ready_for_pickup
- completed
- expired
- cancelled

## Planned Backend

- `atm_orders`

## Planned APIs

- `POST /atm-orders`
- `GET /atm-orders/me`
- `GET /atm-orders/:id`
