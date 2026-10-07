import { ValidationOptions, registerDecorator } from 'class-validator';

// Plain decimal, no sign, no exponent, at most 8 decimal places (the ledger's precision).
const DECIMAL = /^\d{1,12}(\.\d{1,8})?$/;

export function isPositiveAmount(value: unknown): boolean {
  return typeof value === 'string' && DECIMAL.test(value) && parseFloat(value) > 0;
}

/**
 * @IsNumberString() alone accepts "-5" — and every balance update here is
 * "decrement by amount", so a negative amount silently becomes a credit.
 * Use this on any field that ends up moving money.
 */
export function IsPositiveAmount(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveAmount',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} must be a positive number`, ...validationOptions },
      validator: { validate: isPositiveAmount },
    });
  };
}

/** Last line of defense inside the ledger itself, in case a new caller forgets the DTO check. */
export function assertPositiveAmount(amount: string) {
  // Numeric check rather than the strict DTO format: ledger callers pass
  // Prisma Decimal strings, which can come out as e.g. "1e-8".
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Refusing to move a non-positive or malformed amount: ${amount}`);
  }
}
