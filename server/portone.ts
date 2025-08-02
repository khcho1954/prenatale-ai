import crypto from 'crypto';

interface PaymentRequest {
  planType: 'monthly' | 'annual';
  userId: number;
  userEmail: string;
  userName: string;
}

interface PaymentVerification {
  paymentId: string;
  merchantUid: string;
  userId: number;
}

export interface PortonePaymentResponse {
  paymentId: string;
  merchantUid: string;
  amount: number;
  orderName: string;
}

export class PortoneService {
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://api.portone.io';

  constructor() {
    if (!process.env.PORTONE_API_SECRET) {
      console.warn('PORTONE_API_SECRET environment variable not found - PortOne features will be disabled');
      this.apiSecret = '';
      return;
    }
    this.apiSecret = process.env.PORTONE_API_SECRET;
  }

  /**
   * 결제 요청 생성
   */
  createPayment(request: PaymentRequest): PortonePaymentResponse {
    const { planType, userId, userEmail, userName } = request;
    
    // 결제 금액 설정
    const amount = planType === 'monthly' ? 2500 : 24000; // KRW
    
    // 고유한 결제 ID 생성
    const paymentId = `prena_${planType}_${userId}_${Date.now()}`;
    const merchantUid = `merchant_${Date.now()}_${userId}`;
    
    // 주문명 생성
    const orderName = planType === 'monthly' 
      ? 'prena tale 월간 구독' 
      : 'prena tale 연간 구독';

    return {
      paymentId,
      merchantUid,
      amount,
      orderName
    };
  }

  /**
   * 결제 검증 및 처리
   */
  async verifyPayment(verification: PaymentVerification): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { paymentId, merchantUid, userId } = verification;

      // 포트원 API를 통한 결제 상태 확인
      const paymentData = await this.getPaymentData(paymentId);
      
      if (!paymentData) {
        return { success: false, message: '결제 정보를 찾을 수 없습니다' };
      }

      // 결제 상태 확인
      if (paymentData.status !== 'PAID') {
        return { success: false, message: `결제가 완료되지 않았습니다. 상태: ${paymentData.status}` };
      }

      // merchant_uid 검증
      if (paymentData.merchantUid !== merchantUid) {
        return { success: false, message: '주문번호가 일치하지 않습니다' };
      }

      // 결제 금액 검증
      const expectedAmount = this.getExpectedAmount(paymentId);
      if (paymentData.amount !== expectedAmount) {
        return { success: false, message: '결제 금액이 일치하지 않습니다' };
      }

      return { 
        success: true, 
        message: '결제가 성공적으로 완료되었습니다',
        data: {
          paymentId,
          amount: paymentData.amount,
          paidAt: paymentData.paidAt,
          planType: this.getPlanTypeFromPaymentId(paymentId)
        }
      };

    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, message: '결제 검증 중 오류가 발생했습니다' };
    }
  }

  /**
   * 포트원 API에서 결제 정보 조회
   */
  private async getPaymentData(paymentId: string): Promise<any> {
    try {
      // 포트원 API 토큰 발급
      const token = await this.getAccessToken();
      
      // 결제 정보 조회
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Failed to get payment data:', error);
      return null;
    }
  }

  /**
   * 포트원 API 액세스 토큰 발급
   */
  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/login/api-secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiSecret: this.apiSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.accessToken;
  }

  /**
   * 결제 ID에서 예상 금액 추출
   */
  private getExpectedAmount(paymentId: string): number {
    if (paymentId.includes('monthly')) {
      return 2500;
    } else if (paymentId.includes('annual')) {
      return 24000;
    }
    throw new Error('Invalid payment ID format');
  }

  /**
   * 결제 ID에서 플랜 타입 추출
   */
  private getPlanTypeFromPaymentId(paymentId: string): 'monthly' | 'annual' {
    if (paymentId.includes('monthly')) {
      return 'monthly';
    } else if (paymentId.includes('annual')) {
      return 'annual';
    }
    throw new Error('Invalid payment ID format');
  }

  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

export const portoneService = new PortoneService();