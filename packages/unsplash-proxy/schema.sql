DROP TABLE IF EXISTS photos;
CREATE TABLE photos (
  id STRING PRIMARY KEY,
  json STRING NOT NULL,
  last_used_date INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS index_photos_last_used_date ON photos(last_used_date);
