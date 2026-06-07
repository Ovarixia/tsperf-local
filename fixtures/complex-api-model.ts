type ISODate = string & { readonly __brand: "ISODate" };
type Currency = "EUR" | "USD" | "GBP";

type Money<TCurrency extends Currency = "EUR"> = {
  amount: number;
  currency: TCurrency;
  formatted: `${TCurrency} ${number}`;
};

type Permission =
  | "invoice:read"
  | "invoice:write"
  | "customer:read"
  | "customer:write"
  | "workflow:approve"
  | "workflow:reject";

type AuditEvent<TAction extends string, TPayload extends Record<string, unknown>> = {
  id: string;
  action: TAction;
  actor: {
    id: string;
    displayName: string;
    permissions: Permission[];
  };
  payload: TPayload;
  createdAt: ISODate;
};

type CustomerSegment<TKind extends string> = {
  kind: TKind;
  score: number;
  tags: Array<"vip" | "trial" | "late-payer" | "high-touch">;
  risk: {
    level: "low" | "medium" | "high";
    reasons: string[];
  };
};

type Customer<TSegment extends CustomerSegment<string>> = {
  id: string;
  companyName: string;
  segment: TSegment;
  billingAddress: {
    street: string;
    city: string;
    country: string;
    vatNumber?: string;
  };
  contacts: Array<{
    id: string;
    name: string;
    role: "owner" | "finance" | "operations";
    email: string;
  }>;
};

type InvoiceLine<TMeta extends Record<string, unknown>> = {
  sku: string;
  label: string;
  quantity: number;
  unitPrice: Money;
  discounts: Array<{
    code: string;
    amount: Money;
    reason: "contract" | "retention" | "manual";
  }>;
  meta: TMeta;
};

type Invoice<TCustomer extends Customer<CustomerSegment<string>>> = {
  id: string;
  customer: TCustomer;
  status: "draft" | "pending-approval" | "sent" | "paid" | "void";
  lines: Array<InvoiceLine<{ campaign: string; source: "sales" | "self-serve" }>>;
  totals: {
    subtotal: Money;
    tax: Money;
    total: Money;
  };
  timeline: Array<
    | AuditEvent<"created", { invoiceId: string }>
    | AuditEvent<"line-added", { sku: string; quantity: number }>
    | AuditEvent<"approved", { approverId: string }>
    | AuditEvent<"sent", { channel: "email" | "portal" }>
  >;
};

type WorkflowStep<TName extends string, TInput, TOutput> = {
  name: TName;
  input: TInput;
  output: TOutput;
  retryPolicy: {
    maxAttempts: number;
    backoff: "linear" | "exponential";
  };
};

type InvoiceWorkflow<TCustomer extends Customer<CustomerSegment<string>>> = {
  invoice: Invoice<TCustomer>;
  steps: [
    WorkflowStep<"validate-customer", TCustomer, { valid: boolean; missingFields: string[] }>,
    WorkflowStep<"calculate-tax", Invoice<TCustomer>, Invoice<TCustomer>>,
    WorkflowStep<"request-approval", Invoice<TCustomer>, { approvalId: string; status: "pending" | "approved" | "rejected" }>,
    WorkflowStep<"send-invoice", Invoice<TCustomer>, { deliveredAt: ISODate; channel: "email" | "portal" }>
  ];
  permissionsRequired: Permission[];
};

type ApiResponse<TData> =
  | {
      ok: true;
      requestId: string;
      data: TData;
      warnings: Array<{ code: string; message: string }>;
    }
  | {
      ok: false;
      requestId: string;
      error: {
        code: "validation_error" | "permission_denied" | "not_found" | "rate_limited";
        message: string;
        details?: Record<string, unknown>;
      };
    };

type EnterpriseCustomer = Customer<CustomerSegment<"enterprise" | "strategic">>;

declare const result: ApiResponse<InvoiceWorkflow<EnterpriseCustomer>>;

result;
