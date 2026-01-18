import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPhoneAssignmentService } from '../user-phone-assignment.service';

/**
 * Guard to check if user has access to specific phone numbers
 * Automatically injects accessible phone numbers into the request
 */
@Injectable()
export class PhoneNumberAccessGuard implements CanActivate {
  constructor(private readonly assignmentService: UserPhoneAssignmentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins and super_admins have access to all phone numbers
    if (user.role === 'super_admin' || user.role === 'admin') {
      request.accessiblePhoneNumbers = null; // null means all
      request.hasFullAccess = true;
      return true;
    }

    // Get accessible phone numbers for regular users
    const accessiblePhoneNumbers =
      await this.assignmentService.getUserAccessiblePhoneNumbers(
        user.id,
        'calls' // default permission type
      );

    if (accessiblePhoneNumbers.length === 0) {
      throw new ForbiddenException('No phone numbers assigned to this user');
    }

    // Inject accessible phone numbers into request for use in controllers
    request.accessiblePhoneNumbers = accessiblePhoneNumbers;
    request.hasFullAccess = false;

    return true;
  }
}

/**
 * Decorator to extract accessible phone numbers from request
 */
export const AccessiblePhoneNumbers = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  };
};
