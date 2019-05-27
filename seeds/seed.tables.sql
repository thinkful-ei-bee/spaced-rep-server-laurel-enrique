BEGIN;

TRUNCATE
  "word",
  "language",
  "user";

INSERT INTO "user" ("id", "username", "name", "password")
VALUES
  (
    1,
    'admin',
    'Dunder Mifflin Admin',
    -- password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'
  );

INSERT INTO "language" ("id", "name", "user_id")
VALUES
  (1, 'Spanish', 1);

INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
VALUES
  (1, 1, 'elefante', 'elephant', 2),
  (2, 1, 'perro', 'dog', 3),
  (3, 1, 'gato', 'cat', 4),
  (4, 1, 'mano', 'hand', 5),
  (5, 1, 'sol', 'sun', 6),
  (6, 1, 'cafe', 'coffee', 7),
  (7, 1, 'plato', 'plate', 8),
  (8, 1, 'bola', 'ball', 9),
  (9, 1, 'plato', 'plate', 10),
  (10, 1, 'plato', 'plate', null);

UPDATE "language" SET head = 1 WHERE id = 1;

-- because we explicitly set the id fields
-- update the sequencer for future automatic id setting
SELECT setval('word_id_seq', (SELECT MAX(id) from "word"));
SELECT setval('language_id_seq', (SELECT MAX(id) from "language"));
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));

COMMIT;
