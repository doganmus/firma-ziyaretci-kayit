import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: any, args: ValidationArguments): boolean {
    if (typeof password !== 'string') {
      return false;
    }

    // Minimum 8 characters
    if (password.length < 8) {
      return false;
    }

    // At least 1 uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least 1 lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least 1 digit
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // At least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, sayı ve özel karakter içermelidir';
  }
}

/**
 * Decorator for password strength validation
 * Usage: @IsStrongPassword()
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

