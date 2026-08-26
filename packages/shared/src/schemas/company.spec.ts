import { CompanySchema } from "./company";

const validCompany = {
  name: "Aurora Participações S.A.",
  cnpj: "12.345.678/0001-95",
  tradeName: "Aurora Holding",
  address: {
    zipCode: "01310-100",
    street: "Avenida Paulista",
    number: "1842",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP" as const,
  },
};

describe("CompanySchema", () => {
  it("accepts a valid company", () => {
    expect(CompanySchema.safeParse(validCompany).success).toBe(true);
  });

  it("trims surrounding whitespace instead of storing it", () => {
    const result = CompanySchema.parse({
      ...validCompany,
      name: "   Aurora Participações S.A.   ",
      tradeName: "  Aurora Holding  ",
      address: { ...validCompany.address, city: "  São Paulo  " },
    });

    expect(result.name).toBe("Aurora Participações S.A.");
    expect(result.tradeName).toBe("Aurora Holding");
    expect(result.address.city).toBe("São Paulo");
  });

  // Without .trim() before .min(), "  " counts as 2 characters and passes.
  it("rejects a name made only of spaces", () => {
    const result = CompanySchema.safeParse({ ...validCompany, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a trade name made only of spaces", () => {
    const result = CompanySchema.safeParse({ ...validCompany, tradeName: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects address fields made only of spaces", () => {
    const blankAddressFields = [
      { street: "    " },
      { number: " " },
      { neighborhood: "   " },
      { city: "   " },
    ];

    for (const field of blankAddressFields) {
      const result = CompanySchema.safeParse({
        ...validCompany,
        address: { ...validCompany.address, ...field },
      });
      expect(result.success).toBe(false);
    }
  });

  it("still rejects an invalid CNPJ", () => {
    const result = CompanySchema.safeParse({
      ...validCompany,
      cnpj: "12.345.678/0001-96",
    });
    expect(result.success).toBe(false);
  });
});
