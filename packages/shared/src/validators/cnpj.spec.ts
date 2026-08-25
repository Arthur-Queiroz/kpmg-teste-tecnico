import { isValidCnpj, unmaskCnpj } from "./cnpj";

describe("unmaskCnpj", () => {
  it("keeps only digits", () => {
    expect(unmaskCnpj("12.345.678/0001-95")).toBe("12345678000195");
  });

  it("returns an empty string for input without digits", () => {
    expect(unmaskCnpj("sem numeros")).toBe("");
  });
});

describe("isValidCnpj", () => {
  it("accepts a valid CNPJ without mask", () => {
    expect(isValidCnpj("12345678000195")).toBe(true);
  });

  it("accepts a valid CNPJ with mask", () => {
    expect(isValidCnpj("12.345.678/0001-95")).toBe(true);
  });

  it("rejects a CNPJ with an incorrect verification digit", () => {
    expect(isValidCnpj("12345678000196")).toBe(false);
  });

  it("rejects a CNPJ shorter than 14 digits", () => {
    expect(isValidCnpj("1234567800019")).toBe(false);
  });

  it("rejects a CNPJ longer than 14 digits", () => {
    expect(isValidCnpj("123456780001955")).toBe(false);
  });

  it("rejects repeated sequences", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejects non numeric input", () => {
    expect(isValidCnpj("empresa qualquer")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidCnpj("")).toBe(false);
  });

  it("accepts other real world valid CNPJs", () => {
    expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
    expect(isValidCnpj("19131243000197")).toBe(true);
    expect(isValidCnpj("34028316000103")).toBe(true);
  });
});
