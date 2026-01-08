import { getDatabase } from '../config/database';

interface SMSConfig {
  gateway: string;
  api_key?: string;
  api_secret?: string;
  sender_id?: string;
  username?: string;
  password?: string;
  url?: string;
}

let smsConfig: SMSConfig | null = null;

/**
 * Get SMS configuration from database
 */
export const getSMSConfig = async (): Promise<SMSConfig | null> => {
  try {
    const db = getDatabase();

    const [settings] = await db.execute(
      `SELECT 
        sms_gateway,
        sms_api_key,
        sms_api_secret,
        sms_sender_id,
        sms_username,
        sms_password,
        sms_url,
        is_enabled
      FROM sms_settings 
      WHERE is_enabled = 1 
      LIMIT 1`
    ) as any[];

    if (settings.length === 0) {
      return null;
    }

    const setting = settings[0];
    smsConfig = {
      gateway: setting.sms_gateway || '',
      api_key: setting.sms_api_key || undefined,
      api_secret: setting.sms_api_secret || undefined,
      sender_id: setting.sms_sender_id || undefined,
      username: setting.sms_username || undefined,
      password: setting.sms_password || undefined,
      url: setting.sms_url || undefined,
    };

    return smsConfig;
  } catch (error) {
    console.error('Error getting SMS config:', error);
    return null;
  }
};

/**
 * Send SMS using configured gateway
 */
export const sendSMS = async (phone: string, message: string): Promise<void> => {
  try {
    // Get SMS config if not loaded
    if (!smsConfig) {
      const config = await getSMSConfig();
      if (!config) {
        throw new Error('SMS service is not configured. Please configure SMS settings in System Settings.');
      }
    }

    if (!smsConfig) {
      throw new Error('SMS configuration is not available');
    }

    // For now, we'll just log the SMS
    // In production, you would integrate with actual SMS gateways like Twilio, MSG91, etc.
    console.log(`SMS would be sent to ${phone}: ${message.substring(0, 50)}...`);
    
    // TODO: Implement actual SMS gateway integration based on smsConfig.gateway
    // Example for Twilio:
    // if (smsConfig.gateway === 'twilio') {
    //   const client = require('twilio')(smsConfig.api_key, smsConfig.api_secret);
    //   await client.messages.create({
    //     body: message,
    //     from: smsConfig.sender_id,
    //     to: phone
    //   });
    // }

    // For now, we'll simulate success
    // In production, replace this with actual SMS gateway API calls
    return Promise.resolve();
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

