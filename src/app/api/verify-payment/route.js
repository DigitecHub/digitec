import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  console.log('--- PAYMENT VERIFICATION STARTED ---');
  try {
    const body = await request.json();
    const { reference, subCourseIds, courseId } = body;
    console.log('Received request body:', body);

    if (!reference) {
      console.error('Error: Payment reference is missing.');
      return NextResponse.json(
        { status: 'error', message: 'Payment reference is required' },
        { status: 400 }
      );
    }
    console.log(`Verifying reference: ${reference}`);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    console.log('Supabase client initialized.');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication Error:', userError?.message || 'User not found.');
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log(`Authenticated user: ${user.email} (ID: ${user.id})`);

    // First, create a single pending payment record for the transaction
    const initialPaymentPayload = {
      user_id: user.id,
      sub_course_id: subCourseIds[0], // Use the first sub-course as primary
      course_id: courseId,
      paystack_reference: reference,
      payment_status: 'pending',
      amount: 0, // We don't know the amount yet
      metadata: {
        all_sub_course_ids: subCourseIds,
        sub_course_count: subCourseIds.length
      }
    };
    console.log('Attempting to insert single payment record:', initialPaymentPayload);

    const { data: initialPayment, error: initialPaymentError } = await supabase
      .from('payments')
      .insert(initialPaymentPayload)
      .select('id')
      .single();

    if (initialPaymentError) {
      console.error('DATABASE ERROR: Failed to create payment record.', initialPaymentError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to initialize payment record', details: initialPaymentError.message },
        { status: 500 }
      );
    }
    console.log('Successfully created payment record with ID:', initialPayment.id);
    const paymentId = initialPayment.id;

    // Verify payment with Paystack
    console.log('Contacting Paystack to verify transaction...');
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log('Received response from Paystack:', paystackData);

    // If payment verification fails, update all records to 'failed'
    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.warn(`Paystack verification failed for reference: ${reference}. Reason: ${paystackData.message}`);
      await supabase
        .from('payments')
        .update({ 
          payment_status: 'failed', 
          metadata: paystackData 
        })
        .eq('id', paymentId);
      console.log(`Updated payment record to 'failed'.`);

      return NextResponse.json(
        { 
          status: 'error', 
          message: paystackData.message || 'Payment verification failed' 
        },
        { status: 400 }
      );
    }
    console.log('Paystack verification successful.');

    // Payment is successful, update the database record
    const paymentData = paystackData.data;
    const updatePayload = {
      payment_status: 'success',
      amount: paymentData.amount / 100, // Update amount from kobo
      paystack_transaction_id: paymentData.id,
      payment_date: new Date().toISOString(),
      payment_method: paymentData.channel,
      metadata: {
        ...paymentData,
        all_sub_course_ids: subCourseIds,
        sub_course_count: subCourseIds.length,
        verified_at: new Date().toISOString()
      }
    };
    console.log('Attempting to update payment record to success:', updatePayload);

    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId);

    if (updatePaymentError) {
      console.error('DATABASE ERROR: Failed to update payment record to success.', updatePaymentError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to update payment record', details: updatePaymentError.message },
        { status: 500 }
      );
    }
    console.log('Successfully updated payment record to success.');

    // Get the payment record to get payment_id
    const { data: paymentRecord, error: paymentFetchError } = await supabase
      .from('payments')
      .select('id')
      .eq('paystack_reference', reference)
      .eq('user_id', user.id)
      .single();

    if (paymentFetchError) {
      console.error('Error fetching payment record:', paymentFetchError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch payment record' },
        { status: 500 }
      );
    }

    // 5. Create enrollment directly with database operations
    console.log('Creating enrollment for user:', user.id, 'course:', courseId, 'sub-courses:', subCourseIds);
    
    try {
      // Step 1: Create or get main enrollment
      let enrollmentId;
      
      // Check if enrollment already exists
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Error checking existing enrollment: ${checkError.message}`);
      }
      
      if (existingEnrollment) {
        enrollmentId = existingEnrollment.id;
        console.log('Using existing enrollment:', enrollmentId);
      } else {
        // Create new enrollment
        const { data: newEnrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            enrollment_date: new Date().toISOString(),
            status: 'active'
          })
          .select('id')
          .single();
        
        if (enrollmentError) {
          throw new Error(`Error creating enrollment: ${enrollmentError.message}`);
        }
        
        enrollmentId = newEnrollment.id;
        console.log('Created new enrollment:', enrollmentId);
      }
      
      // Step 2: Create sub-course enrollments
      const subEnrollmentPromises = subCourseIds.map(async (subCourseId, index) => {
        // Check if sub-course enrollment already exists
        const { data: existingSubEnrollment, error: checkSubError } = await supabase
          .from('sub_course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('sub_course_id', subCourseId)
          .single();
        
        if (checkSubError && checkSubError.code !== 'PGRST116') {
          throw new Error(`Error checking existing sub-enrollment for ${subCourseId}: ${checkSubError.message}`);
        }
        
        if (existingSubEnrollment) {
          console.log(`Sub-course enrollment already exists for ${subCourseId}:`, existingSubEnrollment.id);
          // Update payment info for existing enrollment
          const { error: updateError } = await supabase
            .from('sub_course_enrollments')
            .update({ 
              payment_id: paymentId, 
              payment_status: 'paid' 
            })
            .eq('id', existingSubEnrollment.id);
          
          if (updateError) {
            throw new Error(`Error updating existing sub-enrollment payment info: ${updateError.message}`);
          }
          
          return existingSubEnrollment.id;
        } else {
          // Create new sub-course enrollment
          const { data: newSubEnrollment, error: subEnrollmentError } = await supabase
            .from('sub_course_enrollments')
            .insert({
              enrollment_id: enrollmentId,
              user_id: user.id,
              course_id: courseId,
              sub_course_id: subCourseId,
              status: 'not_started',
              payment_id: paymentId,
              payment_status: 'paid'
            })
            .select('id')
            .single();
          
          if (subEnrollmentError) {
            throw new Error(`Error creating sub-enrollment for ${subCourseId}: ${subEnrollmentError.message}`);
          }
          
          console.log(`Created sub-course enrollment for ${subCourseId}:`, newSubEnrollment.id);
          return newSubEnrollment.id;
        }
      });
      
      const subEnrollmentIds = await Promise.all(subEnrollmentPromises);
      console.log('All sub-course enrollments processed:', subEnrollmentIds);
      
    } catch (enrollmentError) {
      console.error('Error during enrollment creation:', enrollmentError.message);
      
      await supabase
        .from('payments')
        .update({ 
          payment_status: 'enrollment_failed', 
          metadata: { ...paystackData, enrollment_error: enrollmentError.message }
        })
        .eq('id', paymentId);

      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Payment successful, but enrollment failed.', 
          details: enrollmentError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Payment verified and enrollment successful', 
      data: { 
        payment_id: paymentId,
        enrollment_created: true,
        sub_courses_enrolled: subCourseIds.length,
        ...updatePayload 
      } 
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
