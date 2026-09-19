# Inventory management

Statuses are `AVAILABLE`, `LOW STOCK`, `COMING SOON`, and `SOLD OUT`.

Database and local-driver rules force quantity to zero for Coming Soon and Sold Out. Coming Soon cannot be featured. Keep physical inventory reconciliation outside this site if another system is the source of truth.
