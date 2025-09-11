import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsConditionallyRequired(
  condition: (object: any) => boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isConditionallyRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [conditionFn] = args.constraints;
          if (conditionFn(args.object)) {
            return value !== undefined && value !== null && value !== '';
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required when the condition is met`;
        },
      },
      constraints: [condition],
    });
  };
}
