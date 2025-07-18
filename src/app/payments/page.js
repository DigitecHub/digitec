import PaymentLogs from '../../components/PaymentLogs';

export default function PaymentsPage() {
  return (
    <div>
      <PaymentLogs />
    </div>
  );
}

export const metadata = {
  title: 'Payment History - DigitecHub',
  description: 'View your course payment history and transaction details',
};
