# Pricing system

Pricing is stored as an ordered array of `{ label, price }` pairs on the strain record. This preserves flexible display labels without hardcoding units or currencies.

In Admin, enter one tier per line using `label | price`. The public strain page shows all configured tiers; menu cards show the first tier and fall back to “Inquire for pricing” when none is configured.
