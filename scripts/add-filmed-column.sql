-- Add filmed status to scripts table
-- Run in Supabase → SQL Editor

alter table scripts add column if not exists filmed boolean not null default false;
