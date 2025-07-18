CREATE OR REPLACE FUNCTION create_enrollment_and_sub_enrollments(
    p_user_id UUID,
    p_course_id UUID,
    p_sub_course_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
    v_enrollment_id UUID;
    sub_course_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Create a main enrollment record if it doesn't exist for this user and course
    INSERT INTO enrollments (user_id, course_id, enrollment_date, status)
    SELECT p_user_id, p_course_id, NOW(), 'active'
    WHERE NOT EXISTS (
        SELECT 1 FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id
    )
    RETURNING id INTO v_enrollment_id;

    -- If an enrollment already existed, get its ID
    IF v_enrollment_id IS NULL THEN
        SELECT id INTO v_enrollment_id FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id;
    END IF;

    -- 2. Create sub-course enrollments for the selected sub-courses
    IF array_length(p_sub_course_ids, 1) > 0 THEN
        FOREACH sub_course_id IN ARRAY p_sub_course_ids
        LOOP
            -- Insert only if the user is not already enrolled in this sub-course
            INSERT INTO sub_course_enrollments (enrollment_id, user_id, course_id, sub_course_id, status)
            SELECT v_enrollment_id, p_user_id, p_course_id, sub_course_id, 'not_started'
            WHERE NOT EXISTS (
                SELECT 1 FROM sub_course_enrollments 
                WHERE sub_course_enrollments.user_id = p_user_id AND sub_course_enrollments.sub_course_id = sub_course_id
            );
        END LOOP;
    END IF;

    -- 3. Return success result with enrollment details
    SELECT jsonb_build_object(
        'success', true,
        'enrollment_id', v_enrollment_id,
        'course_id', p_course_id,
        'sub_course_ids', p_sub_course_ids,
        'message', 'Enrollment created successfully'
    ) INTO v_result;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return detailed error information for debugging
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM, -- The error message
            'error_code', SQLSTATE, -- The SQL standard error code
            'message', 'An unexpected error occurred during enrollment.',
            'details', 'Check the database logs for more information.'
        );
END;
$$ LANGUAGE plpgsql;
