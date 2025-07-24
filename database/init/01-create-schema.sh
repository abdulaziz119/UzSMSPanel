#!/bin/bash
set -e

# Create schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS uzsmspanel;
    GRANT ALL PRIVILEGES ON SCHEMA uzsmspanel TO $POSTGRES_USER;
EOSQL

echo "Database schema created successfully!"
