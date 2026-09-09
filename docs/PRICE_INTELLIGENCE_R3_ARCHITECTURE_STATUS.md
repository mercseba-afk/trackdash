# Price Intelligence R3 architecture status

R3 is additive and deliberately separates catalog identity, current purchasable offers, completed-sale evidence, historical unavailable offers, public market signals, and scan scheduling.

Production storage migrations 0037, 0038 and 0039 are applied. The scanner queue remains disabled by default and no crawler/provider is activated by the migration.

The application branch is expected to be merged only after the Vercel preview passes `pnpm verify`, including the dedicated R3 regression suite. Current retail and active marketplace data remain a subsequent provider/data-ingestion step; until those observations exist, `A partire da` is intentionally absent rather than inferred from sold or out-of-stock prices.
