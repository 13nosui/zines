-- Check if images column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'images'
  ) THEN
    ALTER TABLE posts 
    ADD COLUMN images TEXT[] NOT NULL DEFAULT '{}' 
    CHECK (array_length(images, 1) > 0 AND array_length(images, 1) <= 3);
  END IF;
END $$;