declare module 'cashfree-pg-sdk-javascript' {
  export interface CashfreeConfig {
    apiVersion: string;
    secretKey: string;
    environment: 'PRODUCTION' | 'SANDBOX';
  }

  export interface CustomerDetails {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }

  export interface SubscriptionMeta {
    returnUrl: string;
    notifyUrl: string;
  }

  export interface SubscriptionRequest {
    subscriptionId: string;
    planId: string;
    customerDetails: CustomerDetails;
    subscriptionMeta: SubscriptionMeta;
  }

  export interface SubscriptionResponse {
    status: 'SUCCESS' | 'ERROR';
    subscriptionId?: string;
    authLink?: string;
    message?: string;
  }

  export interface SubscriptionDetails {
    subscriptionId: string;
    planId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }

  export class Cashfree {
    constructor(config: CashfreeConfig);
    
    PGCreateSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse>;
    PGFetchSubscription(subscriptionId: string): Promise<SubscriptionDetails>;
    PGCancelSubscription(subscriptionId: string): Promise<{ status: string }>;
  }
}
