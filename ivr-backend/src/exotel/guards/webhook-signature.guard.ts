import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Webhook Signature Guard
 * Validates that incoming webhooks are from Exotel by verifying the tokenMd5
 *
 * Security layers:
 * 1. Token MD5 verification - Validates tokenMd5 in URL matches our secret
 * 2. Timestamp validation - Prevents replay attacks (optional, can be added)
 * 3. IP whitelist - Validates request comes from Exotel IPs (optional, can be added)
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private configService: ConfigService) {}

  /**
   * Generate MD5 hash for token verification
   */
  private generateMd5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Get expected tokenMd5 from environment
   */
  private getExpectedToken(): string {
    const apiKey = this.configService.get<string>('EXOTEL_API_KEY');
    const apiSecret = this.configService.get<string>('EXOTEL_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Missing Exotel credentials for webhook verification');
    }

    return this.generateMd5(`${apiKey}:${apiSecret}`);
  }

  /**
   * Validate Exotel IP address (optional additional security layer)
   * Exotel typically sends webhooks from specific IP ranges
   */
  private isValidExotelIp(ip: string): boolean {
    // TODO: Add Exotel's official IP whitelist
    // For now, we'll skip IP validation and rely on tokenMd5
    // Exotel's IPs can be found in their documentation

    // Example whitelist (update with actual Exotel IPs):
    // const exotelIpRanges = [
    //   '52.66.0.0/16',      // Exotel India
    //   '13.126.0.0/16',     // Exotel India
    //   '13.250.0.0/16',     // Exotel Singapore
    // ];

    return true; // Skip IP validation for now
  }

  /**
   * Validate request timestamp to prevent replay attacks
   */
  private isValidTimestamp(timestamp?: string): boolean {
    if (!timestamp) {
      // If no timestamp provided, skip validation
      return true;
    }

    const MAX_AGE_SECONDS = 300; // 5 minutes
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const age = (currentTime - requestTime) / 1000;

    return age >= 0 && age <= MAX_AGE_SECONDS;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract tokenMd5 from URL params
    const providedToken = request.params.tokenMd5;

    if (!providedToken) {
      this.logger.warn('Webhook request missing tokenMd5 in URL');
      throw new UnauthorizedException('Missing webhook verification token');
    }

    // Get expected token
    const expectedToken = this.getExpectedToken();

    // Verify token matches
    if (providedToken !== expectedToken) {
      this.logger.warn(`Invalid webhook token received. Expected: ${expectedToken.substring(0, 8)}..., Got: ${providedToken.substring(0, 8)}...`);
      this.logger.warn(`Request from IP: ${request.ip}, User-Agent: ${request.headers['user-agent']}`);
      throw new UnauthorizedException('Invalid webhook verification token');
    }

    // Optional: Validate IP address
    const clientIp = request.ip || request.connection.remoteAddress;
    if (!this.isValidExotelIp(clientIp)) {
      this.logger.warn(`Webhook request from non-whitelisted IP: ${clientIp}`);
      // Uncomment to enforce IP whitelist:
      // throw new UnauthorizedException('Request from unauthorized IP address');
    }

    // Optional: Validate timestamp (if provided in body)
    const timestamp = request.body?.DateCreated || request.body?.date_created;
    if (!this.isValidTimestamp(timestamp)) {
      this.logger.warn(`Webhook request has invalid/expired timestamp: ${timestamp}`);
      // Uncomment to enforce timestamp validation:
      // throw new UnauthorizedException('Request timestamp is invalid or expired');
    }

    this.logger.debug(`Webhook signature verified successfully for ${request.path}`);
    return true;
  }
}
