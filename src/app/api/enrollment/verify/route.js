import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get course and sub-course IDs from request
  const { courseId, subCourseIds, reference } = await request.json();
  
  if (!courseId || !subCourseIds || !Array.isArray(subCourseIds) || subCourseIds.length === 0) {
    return NextResponse.json(
      { error: 'Course ID and sub-course IDs are required' },
      { status: 400 }
    );
  }
  
  // Validate UUID format for courseId and subCourseIds
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(courseId)) {
    return NextResponse.json(
      { error: 'Invalid course ID format' },
      { status: 400 }
    );
  }
  
  for (const subCourseId of subCourseIds) {
    if (!uuidRegex.test(subCourseId)) {
      return NextResponse.json(
        { error: 'Invalid sub-course ID format' },
        { status: 400 }
      );
    }
  }

  // 1. Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  // 2. Verify the payment with Paystack
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    console.error('Paystack secret key is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      // Log failed payment attempt
      await supabase.from('payments').insert({
        user_id: user.id,
        email: user.email,
        amount: 0,
        paystack_reference: reference,
        payment_status: 'failed',
        course_id: courseId,
        sub_course_ids: subCourseIds,
        metadata: paystackData
      });
      
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 3. Verify the amount paid is correct
    const { data: subCoursesData, error: subCoursesError } = await supabase
      .from('sub_courses')
      .select('id, price')
      .in('id', subCourseIds);

    if (subCoursesError) throw subCoursesError;

    const expectedAmount = subCoursesData.reduce((acc, sc) => acc + (sc.price || 0), 0);
    const paidAmount = paystackData.data.amount / 100; // Paystack amount is in kobo

    if (paidAmount < expectedAmount) {
      // Log insufficient payment
      await supabase.from('payments').insert({
        user_id: user.id,
        email: user.email,
        amount: paidAmount,
        paystack_reference: reference,
        payment_status: 'insufficient_amount',
        course_id: courseId,
        sub_course_ids: subCourseIds,
        metadata: paystackData
      });
      
      return NextResponse.json({ error: 'Paid amount is less than the expected amount.' }, { status: 400 });
    }

    // 4. Log successful payment first
    const { data: paymentLog, error: paymentError } = await supabase.from('payments').insert({
      user_id: user.id,
      email: user.email,
      amount: paidAmount,
      paystack_reference: reference,
      payment_status: 'success',
      course_id: courseId,
      sub_course_ids: subCourseIds,
      metadata: paystackData,
      payment_date: new Date().toISOString()
    }).select().single();

    if (paymentError) {
      console.error('Error logging payment:', paymentError);
      // Continue with enrollment even if logging fails
    }

    // 5. Create the enrollment records in the database
    // Create enrollment and sub-enrollments using RPC
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_enrollment_and_sub_enrollments', {
        p_user_id: user.id,
        p_course_id: courseId, // Now using UUID directly
        p_sub_course_ids: subCourseIds // Now using UUID array directly
      });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      
      // Update payment status to enrollment_failed
      await supabase
        .from('payments')
        .update({ 
          payment_status: 'enrollment_failed',
          metadata: { 
            ...paymentLog.metadata, 
            enrollment_error: rpcError.message 
          }
        })
        .eq('paystack_reference', reference);
      
      return NextResponse.json(
        { error: 'Failed to create enrollment', details: rpcError.message },
        { status: 500 }
      );
    }
    
    // Check if RPC returned an error in the result
    if (rpcResult && !rpcResult.success) {
      console.error('RPC returned error:', rpcResult);
      
      // Update payment status to enrollment_failed
      await supabase
        .from('payments')
        .update({ 
          payment_status: 'enrollment_failed',
          metadata: { 
            ...paymentLog.metadata, 
            enrollment_error: rpcResult.error || rpcResult.message 
          }
        })
        .eq('paystack_reference', reference);
      
      return NextResponse.json(
        { 
          error: 'Failed to create enrollment', 
          details: rpcResult.message || rpcResult.error,
          error_code: rpcResult.error_code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and enrollment created successfully',
      data: {
        reference: paystackData.data.reference,
        amount: paystackData.data.amount / 100,
        currency: paystackData.data.currency,
        enrollment_created: true,
        enrollment_details: rpcResult,
        payment_id: paymentLog?.id
      }
    });

  } catch (error) {
    console.error('Error during payment verification or enrollment:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
