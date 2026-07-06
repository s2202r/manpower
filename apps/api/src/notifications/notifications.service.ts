import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ShiftOfferPayload {
  worker: { name: string; phone: string };
  request: {
    title: string;
    date: Date;
    shiftStart: string;
    shiftEnd: string;
    site: { name: string; address: string };
  };
  offerId: string;
}

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  languageCode: string;
  components: unknown[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly apiVersion: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.apiVersion = config.get('WHATSAPP_API_VERSION') ?? 'v18.0';
    this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID') ?? 'STUB';
    this.accessToken = config.get('WHATSAPP_ACCESS_TOKEN') ?? 'STUB';
  }

  /**
   * Send a shift offer notification via WhatsApp Cloud API.
   * Template: "shift_offer" with variables:
   *   {{1}} worker first name
   *   {{2}} shift title
   *   {{3}} date (DD MMM YYYY)
   *   {{4}} time range (HH:MM - HH:MM)
   *   {{5}} site name
   *   {{6}} offer accept deep-link
   */
  async sendShiftOffer(payload: ShiftOfferPayload): Promise<void> {
    const dateStr = new Date(payload.request.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const message: WhatsAppMessage = {
      to: payload.worker.phone.replace(/\D/g, ''), // strip non-digits
      templateName: 'shift_offer',
      languageCode: 'en_IN',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: payload.worker.name.split(' ')[0] },
            { type: 'text', text: payload.request.title },
            { type: 'text', text: dateStr },
            { type: 'text', text: `${payload.request.shiftStart} - ${payload.request.shiftEnd}` },
            { type: 'text', text: payload.request.site.name },
            { type: 'text', text: `https://app.manpower.in/offers/${payload.offerId}` },
          ],
        },
      ],
    };

    this.logger.log(
      `[WhatsApp STUB] Sending shift offer to ${payload.worker.phone} (${payload.worker.name})`,
    );
    this.logger.debug(JSON.stringify(message, null, 2));

    if (this.phoneNumberId === 'STUB' || this.accessToken === 'STUB') {
      this.logger.warn('[WhatsApp STUB] No real credentials — message NOT sent');
      return;
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const body = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'template',
        template: {
          name: message.templateName,
          language: { code: message.languageCode },
          components: message.components,
        },
      };
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`WhatsApp message sent: ${JSON.stringify(response.data)}`);
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Send a generic WhatsApp text message (utility / admin alerts).
   */
  async sendText(phone: string, text: string): Promise<void> {
    this.logger.log(`[WhatsApp STUB] Text to ${phone}: ${text}`);

    if (this.phoneNumberId === 'STUB' || this.accessToken === 'STUB') return;

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  /**
   * Create a Razorpay payment link (stubbed).
   */
  async createRazorpayPaymentLink(params: {
    amount: number; // in paise
    currency?: string;
    description: string;
    customerEmail?: string;
    customerPhone?: string;
    referenceId: string;
  }): Promise<{ id: string; short_url: string }> {
    this.logger.log(
      `[Razorpay STUB] Creating payment link: ₹${params.amount / 100} for "${params.description}"`,
    );

    // Return a stub response shaped like Razorpay's real response
    return {
      id: `plink_stub_${params.referenceId}`,
      short_url: `https://rzp.io/l/stub-${params.referenceId}`,
    };
  }
}
