\c cashapp

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    username text PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    photo_url text DEFAULT 'https://icon-library.net/images/default-user-icon/default-user-icon-4.jpg',
    wallet float DEFAULT 10000,
    bio text
);

CREATE TABLE transactions (
    id serial PRIMARY KEY,
    sender text NOT NULL REFERENCES users ON DELETE CASCADE,
    receiver text NOT NULL REFERENCES users ON DELETE CASCADE,
    amt float NOT NULL,
    paid_date date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT transactions_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO users
  VALUES ('dmarket7', 'Dario', 'Mercado'),
         ('spongebob', 'Sponge', 'Bob');

INSERT INTO transactions (sender, receiver, amt)
  VALUES ('dmarket7', 'spongebob', 100),
         ('spongebob', 'dmarket7', 200);
