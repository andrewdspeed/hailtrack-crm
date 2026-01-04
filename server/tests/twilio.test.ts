import { describe, it, expect } from 'vitest';
import twilio from 'twilio';

describe('Twilio Configuration', () => {
  it('should validate Twilio credentials', async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(phoneNumber).toBeDefined();

    // Create Twilio client
    const client = twilio(accountSid, authToken);

    // Validate credentials by fetching account info
    try {
      const account = await client.api.accounts(accountSid).fetch();
      expect(account.sid).toBe(accountSid);
      expect(account.status).toBe('active');
    } catch (error: any) {
      throw new Error(`Twilio credentials invalid: ${error.message}`);
    }
  });

  it('should validate phone number format', () => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    expect(phoneNumber).toMatch(/^\+\d{10,15}$/);
  });
});
