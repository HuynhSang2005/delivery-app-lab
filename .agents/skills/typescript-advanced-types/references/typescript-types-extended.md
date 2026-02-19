# TypeScript Advanced Types - Extended Reference

Extended examples and detailed patterns moved from the main skill file.

---

## Pattern 4: Deep Readonly/Partial

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P];
};

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// All nested properties are readonly

type PartialConfig = DeepPartial<Config>;
// All nested properties are optional
```

## Pattern 5: Type-Safe Form Validation

```typescript
type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldValidation<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

type ValidationErrors<T> = {
  [K in keyof T]?: string[];
};

class FormValidator<T extends Record<string, any>> {
  constructor(private rules: FieldValidation<T>) {}

  validate(data: T): ValidationErrors<T> | null {
    const errors: ValidationErrors<T> = {};
    let hasErrors = false;

    for (const key in this.rules) {
      const fieldRules = this.rules[key];
      const value = data[key];

      if (fieldRules) {
        const fieldErrors: string[] = [];

        for (const rule of fieldRules) {
          if (!rule.validate(value)) {
            fieldErrors.push(rule.message);
          }
        }

        if (fieldErrors.length > 0) {
          errors[key] = fieldErrors;
          hasErrors = true;
        }
      }
    }

    return hasErrors ? errors : null;
  }
}

interface LoginForm {
  email: string;
  password: string;
}

const validator = new FormValidator<LoginForm>({
  email: [
    {
      validate: (v) => v.includes("@"),
      message: "Email must contain @",
    },
    {
      validate: (v) => v.length > 0,
      message: "Email is required",
    },
  ],
  password: [
    {
      validate: (v) => v.length >= 8,
      message: "Password must be at least 8 characters",
    },
  ],
});

const errors = validator.validate({
  email: "invalid",
  password: "short",
});
// Type: { email?: string[]; password?: string[]; } | null
```

## Pattern 6: Discriminated Unions

```typescript
type Success<T> = {
  status: "success";
  data: T;
};

type Error = {
  status: "error";
  error: string;
};

type Loading = {
  status: "loading";
};

type AsyncState<T> = Success<T> | Error | Loading;

function handleState<T>(state: AsyncState<T>): void {
  switch (state.status) {
    case "success":
      console.log(state.data); // Type: T
      break;
    case "error":
      console.log(state.error); // Type: string
      break;
    case "loading":
      console.log("Loading...");
      break;
  }
}

// Type-safe state machine
type State =
  | { type: "idle" }
  | { type: "fetching"; requestId: string }
  | { type: "success"; data: any }
  | { type: "error"; error: Error };

type Event =
  | { type: "FETCH"; requestId: string }
  | { type: "SUCCESS"; data: any }
  | { type: "ERROR"; error: Error }
  | { type: "RESET" };

function reducer(state: State, event: Event): State {
  switch (state.type) {
    case "idle":
      return event.type === "FETCH"
        ? { type: "fetching", requestId: event.requestId }
        : state;
    case "fetching":
      if (event.type === "SUCCESS") {
        return { type: "success", data: event.data };
      }
      if (event.type === "ERROR") {
        return { type: "error", error: event.error };
      }
      return state;
    case "success":
    case "error":
      return event.type === "RESET" ? { type: "idle" } : state;
  }
}
```

---

## Type Inference Techniques

### 1. Infer Keyword

```typescript
// Extract array element type
type ElementType<T> = T extends (infer U)[] ? U : never;

type NumArray = number[];
type Num = ElementType<NumArray>; // number

// Extract promise type
type PromiseType<T> = T extends Promise<infer U> ? U : never;

type AsyncNum = PromiseType<Promise<number>>; // number

// Extract function parameters
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function foo(a: string, b: number) {}
type FooParams = Parameters<typeof foo>; // [string, number]
```

### 2. Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

const data: unknown = ["a", "b", "c"];

if (isArrayOf(data, isString)) {
  data.forEach((s) => s.toUpperCase()); // Type: string[]
}
```

### 3. Assertion Functions

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Not a string");
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // value is now typed as string
  console.log(value.toUpperCase());
}
```

---

## Best Practices

1. **Use `unknown` over `any`**: Enforce type checking
2. **Prefer `interface` for object shapes**: Better error messages
3. **Use `type` for unions and complex types**: More flexible
4. **Leverage type inference**: Let TypeScript infer when possible
5. **Create helper types**: Build reusable type utilities
6. **Use const assertions**: Preserve literal types
7. **Avoid type assertions**: Use type guards instead
8. **Document complex types**: Add JSDoc comments
9. **Use strict mode**: Enable all strict compiler options
10. **Test your types**: Use type tests to verify type behavior

---

## Type Testing

```typescript
// Type assertion tests
type AssertEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

type Test1 = AssertEqual<string, string>; // true
type Test2 = AssertEqual<string, number>; // false
type Test3 = AssertEqual<string | number, string>; // false

// Expect error helper
type ExpectError<T extends never> = T;

// Example usage
type ShouldError = ExpectError<AssertEqual<string, number>>;
```

---

## Common Pitfalls

1. **Over-using `any`**: Defeats the purpose of TypeScript
2. **Ignoring strict null checks**: Can lead to runtime errors
3. **Too complex types**: Can slow down compilation
4. **Not using discriminated unions**: Misses type narrowing opportunities
5. **Forgetting readonly modifiers**: Allows unintended mutations
6. **Circular type references**: Can cause compiler errors
7. **Not handling edge cases**: Like empty arrays or null values

---

## Performance Considerations

- Avoid deeply nested conditional types
- Use simple types when possible
- Cache complex type computations
- Limit recursion depth in recursive types
- Use build tools to skip type checking in production

---

## Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **Type Challenges**: https://github.com/type-challenges/type-challenges
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Effective TypeScript**: Book by Dan Vanderkam
