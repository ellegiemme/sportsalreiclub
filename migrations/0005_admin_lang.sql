-- Language of the admin panel for each person: 'it' or 'pt'.
ALTER TABLE admin_users ADD COLUMN lang TEXT NOT NULL DEFAULT 'it';
