import { Pilots, PaymentMonthly } from './src/models';

async function debug() {
  try {
    const pilot5 = await Pilots.findOne({
      where: { userId: 5 },
      include: [{ model: PaymentMonthly, as: 'paymentMonthlies' }]
    });

    if (!pilot5) {
      console.log('Pilot 5 not found');
      return;
    }

    console.log('Pilot 5:', JSON.stringify(pilot5.toJSON(), null, 2));
  } catch (error) {
    console.error('Error debugging:', error);
  }
}

debug();
