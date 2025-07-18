CREATE OR REPLACE FUNCTION get_course_details_with_pricing(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  category TEXT,
  level TEXT,
  duration TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  min_price DECIMAL,
  currency VARCHAR,
  is_completely_free BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.image_url,
    c.video_url,
    c.category,
    c.level,
    c.duration,
    c.order_index,
    c.created_at,
    c.updated_at,
    sc_agg.min_price,
    sc_agg.currency,
    sc_agg.is_completely_free
  FROM
    courses c
  LEFT JOIN (
    SELECT
      sc.course_id,
      MIN(CASE WHEN sc.is_free = false THEN sc.price ELSE NULL END) as min_price,
      MAX(sc.currency)::VARCHAR as currency,
      COALESCE(BOOL_AND(sc.is_free), true) as is_completely_free
    FROM
      sub_courses sc
    WHERE sc.course_id = p_course_id
    GROUP BY
      sc.course_id
  ) sc_agg ON c.id = sc_agg.course_id
  WHERE c.id = p_course_id;
END;
$$ LANGUAGE plpgsql;
