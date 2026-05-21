type Address = {
  street: string;
  city: string;
  country: string;
};

type Customer = {
  id: string;
  name: string;
  address: Address;
  tags: Array<"vip" | "trial" | "internal">;
};

type InvoiceLine<TMeta extends Record<string, unknown>> = {
  sku: string;
  quantity: number;
  unitPrice: number;
  meta: TMeta;
};

type Invoice<TMeta extends Record<string, unknown>> = {
  id: string;
  customer: Customer;
  lines: Array<InvoiceLine<TMeta>>;
  status: "draft" | "open" | "paid" | "void";
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
};

const invoice: Invoice<{ campaign: string; riskScore: number }> = {
  id: "inv_001",
  customer: {
    id: "cus_001",
    name: "Example",
    address: {
      street: "1 Main Street",
      city: "Paris",
      country: "France",
    },
    tags: ["trial"],
  },
  lines: [
    {
      sku: "audit",
      quantity: 1,
      unitPrice: 100,
      meta: {
        campaign: "launch",
        riskScore: 2,
      },
    },
  ],
  status: "open",
  totals: {
    subtotal: 100,
    tax: 20,
    total: 120,
  },
};

invoice.customer.address.city;
