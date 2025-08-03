import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are required');
}

const Environment = checkoutNodeJssdk.core.SandboxEnvironment;
const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

export { paypalClient };

export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
};