-- Add unique constraint on cities.name to prevent duplicate city entries on repeated seeds
CREATE UNIQUE INDEX IF NOT EXISTS "cities_name_key" ON "cities"("name");
