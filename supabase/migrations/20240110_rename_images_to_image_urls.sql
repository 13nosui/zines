-- Rename images column to image_urls in posts table
DO $$
BEGIN
  -- Check if the images column exists and image_urls doesn't exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'images'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'image_urls'
  ) THEN
    -- Rename the column
    ALTER TABLE posts RENAME COLUMN images TO image_urls;
  END IF;
END $$;

-- Update the function to use image_urls instead of images
CREATE OR REPLACE FUNCTION insert_post_with_images(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_tags TEXT[],
  p_image_urls TEXT[]
) RETURNS posts AS $$
DECLARE
  new_post posts;
BEGIN
  INSERT INTO posts (user_id, title, body, tags, image_urls)
  VALUES (p_user_id, p_title, p_body, p_tags, p_image_urls)
  RETURNING * INTO new_post;
  
  RETURN new_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;