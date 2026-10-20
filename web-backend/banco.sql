DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS watchlists;
DROP TABLE IF EXISTS medias;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL,
  created_at DATETIME
);

CREATE TABLE follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_user_id INTEGER NOT NULL,
  followed_user_id INTEGER NOT NULL,
  FOREIGN KEY (follower_user_id) REFERENCES users (id),
  FOREIGN KEY (followed_user_id) REFERENCES users (id)
);

CREATE TABLE medias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  genres TEXT,
  soundtracks TEXT,
  release_year INTEGER,
  age_rating TEXT,
  duration_minutes INTEGER,
  trailer_url TEXT,
  cover_image_url TEXT,
  rating_average REAL
);

CREATE TABLE watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (media_id) REFERENCES medias (id)
);

CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  comment TEXT,
  created_at DATETIME,
  FOREIGN KEY (media_id) REFERENCES medias (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);