type RouteEvent =
  | { kind: "page:view"; path: string; referrer?: string; campaign?: string }
  | { kind: "page:leave"; path: string; durationMs: number }
  | { kind: "checkout:start"; cartId: string; lineCount: number }
  | { kind: "checkout:step"; cartId: string; step: "shipping" | "payment" | "review" }
  | { kind: "checkout:complete"; orderId: string; total: number; currency: "EUR" | "USD" | "GBP" }
  | { kind: "account:create"; userId: string; plan: "free" | "team" | "enterprise" }
  | { kind: "account:update"; userId: string; fields: Array<"name" | "email" | "plan"> }
  | { kind: "billing:invoice"; invoiceId: string; status: "draft" | "open" | "paid" | "void" }
  | { kind: "support:ticket"; ticketId: string; priority: "low" | "medium" | "high" }
  | { kind: "security:challenge"; userId: string; method: "email" | "totp" | "webauthn" };

declare const unionTarget: RouteEvent;

unionTarget;

type Identity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type BillingProfile = {
  vatNumber?: string;
  invoiceEmail: string;
  billingAddress: {
    street: string;
    city: string;
    country: string;
  };
};

type FeatureFlags = {
  features: {
    auditLog: boolean;
    advancedBilling: boolean;
    prioritySupport: boolean;
  };
};

type AccountRecord = Identity &
  BillingProfile &
  FeatureFlags & {
    plan: "free" | "team" | "enterprise";
    seats: number;
  };

declare const intersectionTarget: AccountRecord;

intersectionTarget;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

declare const recursiveTarget: JsonValue;

recursiveTarget;

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Array<infer TItem>
    ? ReadonlyArray<DeepReadonly<TItem>>
    : T extends object
      ? { readonly [TKey in keyof T]: DeepReadonly<T[TKey]> }
      : T;

type Catalog = {
  products: Array<{
    sku: string;
    prices: Record<"EUR" | "USD" | "GBP", number>;
    tags: Array<"new" | "featured" | "discounted" | "archived">;
  }>;
  collections: Record<
    "home" | "checkout" | "retention",
    {
      title: string;
      productSkus: string[];
      rules: Array<{ field: "plan" | "country" | "segment"; operator: "eq" | "neq"; value: string }>;
    }
  >;
};

declare const mappedTarget: DeepReadonly<Catalog>;

mappedTarget;

type Step<TName extends string, TInput, TOutput> = {
  name: TName;
  input: TInput;
  output: TOutput;
  retry: {
    attempts: number;
    backoff: "linear" | "exponential";
  };
};

type Pipeline<TSeed, TSteps extends readonly Step<string, unknown, unknown>[]> = {
  seed: TSeed;
  steps: TSteps;
  final: TSteps extends readonly [...unknown[], Step<string, unknown, infer TLast>] ? TLast : TSeed;
  audit: Array<{
    step: TSteps[number]["name"];
    startedAt: string;
    completedAt?: string;
  }>;
};

type OnboardingPipeline = Pipeline<
  { email: string; plan: "team" | "enterprise" },
  [
    Step<"validate-domain", { email: string }, { domain: string; trusted: boolean }>,
    Step<"create-workspace", { domain: string }, { workspaceId: string; region: "eu" | "us" }>,
    Step<"provision-billing", { workspaceId: string }, { billingId: string; trialEndsAt: string }>,
    Step<"send-invite", { workspaceId: string; billingId: string }, { inviteId: string; delivered: boolean }>
  ]
>;

declare const genericTarget: OnboardingPipeline;

genericTarget;
