CREATE TABLE IF NOT EXISTS commodities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'DKI Jakarta'
);

CREATE TABLE IF NOT EXISTS prices (
    id TEXT PRIMARY KEY,
    commodity_id TEXT NOT NULL,
    market_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (commodity_id) REFERENCES commodities (id),
    FOREIGN KEY (market_id) REFERENCES markets (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prices_commodity_market_date ON prices (commodity_id, market_id, date);

