-- Rename users.email to users.login (unique constraint carries over automatically)
ALTER TABLE "users" RENAME COLUMN "email" TO "login";
