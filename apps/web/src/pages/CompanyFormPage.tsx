import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  BRAZILIAN_STATES,
  CompanySchema,
  isValidCnpj,
  type BrazilianState,
} from "@kpmg/shared";

import { companyApi } from "../api/companyApi";
import { ApiError } from "../api/httpClient";
import { Button } from "../components/Button";
import { ErrorState } from "../components/ErrorState";
import { FormSection } from "../components/FormSection";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { useCepLookup, type CepLookupStatus } from "../hooks/useCepLookup";
import { useToast } from "../hooks/useToast";
import { maskCnpj, maskZipCode, unmaskZipCode } from "../lib/masks";

type CompanyFormValues = z.input<typeof CompanySchema>;
type CompanyFormOutput = z.output<typeof CompanySchema>;

const EMPTY_FORM_VALUES: CompanyFormValues = {
  name: "",
  cnpj: "",
  tradeName: "",
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    // "" é o estado "nenhuma UF escolhida" — o schema recusa com "Selecione a UF.".
    state: "" as BrazilianState,
  },
};

const cepHintByStatus: Record<CepLookupStatus, { text: string; className: string }> = {
  idle: { text: "Digite 8 dígitos para buscar.", className: "text-text-muted" },
  loading: { text: "Consultando CEP...", className: "text-text-muted" },
  success: {
    text: "Endereço preenchido. Campos editáveis.",
    className: "text-success",
  },
  not_found: {
    text: "CEP não encontrado. Preencha manualmente.",
    className: "text-warning",
  },
  network_error: {
    text: "Falha na consulta. Preencha manualmente.",
    className: "text-warning",
  },
};

export function CompanyFormPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { showToast } = useToast();

  const isEditMode = Boolean(companyId);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    isEditMode ? "loading" : "ready",
  );
  const [loadCount, setLoadCount] = useState(0);
  const [editedCompanyName, setEditedCompanyName] = useState("");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues, unknown, CompanyFormOutput>({
    resolver: zodResolver(CompanySchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const zipCodeValue = watch("address.zipCode");
  const cnpjValue = watch("cnpj");
  const lastAutofilledZipCode = useRef<string | null>(null);
  const loadedZipCode = useRef<string | null>(null);

  // O CEP que veio da API já tem endereço: enquanto o usuário não mexer nele,
  // não há o que consultar nem status de busca a mostrar.
  const isLoadedZipCodeUntouched =
    unmaskZipCode(zipCodeValue) === loadedZipCode.current;
  const cepLookup = useCepLookup(isLoadedZipCodeUntouched ? "" : zipCodeValue);

  useEffect(() => {
    if (!companyId) return;

    let isCurrentRequest = true;
    setLoadStatus("loading");

    companyApi
      .getCompany(companyId)
      .then((company) => {
        if (!isCurrentRequest) return;

        loadedZipCode.current = company.address.zipCode;
        lastAutofilledZipCode.current = company.address.zipCode;
        setEditedCompanyName(company.name);
        reset({
          name: company.name,
          cnpj: maskCnpj(company.cnpj),
          tradeName: company.tradeName,
          address: {
            ...company.address,
            zipCode: maskZipCode(company.address.zipCode),
            complement: company.address.complement ?? "",
          },
        });
        setLoadStatus("ready");
      })
      .catch(() => {
        if (isCurrentRequest) setLoadStatus("error");
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [companyId, loadCount, reset]);

  useEffect(() => {
    if (cepLookup.status !== "success" || !cepLookup.data) return;

    const digits = unmaskZipCode(zipCodeValue);
    if (lastAutofilledZipCode.current === digits) return;
    lastAutofilledZipCode.current = digits;

    const { street, neighborhood, city, state } = cepLookup.data;
    if (street) setValue("address.street", street, { shouldValidate: true });
    if (neighborhood)
      setValue("address.neighborhood", neighborhood, { shouldValidate: true });
    if (city) setValue("address.city", city, { shouldValidate: true });
    if (state) setValue("address.state", state, { shouldValidate: true });
  }, [cepLookup, zipCodeValue, setValue]);

  const submitForm = handleSubmit(
    async (values) => {
      try {
        if (companyId) {
          await companyApi.updateCompany(companyId, values);
          showToast({
            kind: "success",
            title: "Empresa atualizada",
            text: `Os dados de ${values.name} foram salvos.`,
          });
        } else {
          await companyApi.createCompany(values);
          showToast({
            kind: "success",
            title: "Empresa cadastrada",
            text: "E-mail de notificação enviado ao responsável.",
          });
        }
        navigate("/");
      } catch (error) {
        applyApiError(error);
      }
    },
    () => {
      showToast({
        kind: "error",
        title: "Não foi possível salvar",
        text: "Revise os campos destacados no formulário.",
      });
    },
  );

  function applyApiError(error: unknown) {
    if (!(error instanceof ApiError)) {
      showToast({
        kind: "error",
        title: "Não foi possível salvar",
        text: "Erro inesperado. Tente novamente.",
      });
      return;
    }

    const fieldErrors = Object.entries(error.fieldErrors);
    for (const [field, message] of fieldErrors) {
      setError(field as Path<CompanyFormValues>, { message });
    }

    // 409 é sempre CNPJ duplicado (ver docs/03-API-SPEC.md).
    if (error.statusCode === 409 && fieldErrors.length === 0) {
      setError("cnpj", { message: error.message });
    }

    showToast({
      kind: "error",
      title: "Não foi possível salvar",
      text: error.message,
    });
  }

  if (loadStatus === "error") {
    return (
      <main className="mx-auto w-full max-w-[1020px] p-8">
        <div className="rounded-card border border-border bg-white shadow-elevation-1">
          <ErrorState
            title="Não foi possível carregar a empresa"
            description="Falha ao consultar os dados desta empresa. Verifique a conexão e tente novamente."
            onRetry={() => setLoadCount((current) => current + 1)}
          />
        </div>
      </main>
    );
  }

  const cepHint = cepHintByStatus[cepLookup.status];
  const isCnpjValid = !errors.cnpj && isValidCnpj(cnpjValue ?? "");

  return (
    <main className="mx-auto w-full max-w-[1020px] p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-5 px-0 py-0 text-small"
      >
        ‹ Voltar para Empresas
      </Button>

      <h1 className="text-h2 font-semibold tracking-[-0.01em]">
        {isEditMode ? "Editar Empresa" : "Cadastrar Nova Empresa"}
      </h1>
      <p className="mt-1.5 mb-7 text-body text-text-muted">
        {isEditMode
          ? `Atualize os dados de ${editedCompanyName}.`
          : "Os dois blocos abaixo espelham a modelagem: Company e Address."}
      </p>

      {loadStatus === "loading" ? (
        <p className="text-body text-text-muted">Carregando dados da empresa...</p>
      ) : (
        <form onSubmit={submitForm} noValidate className="grid gap-5">
          <FormSection
            stepNumber={1}
            title="Dados da Empresa"
            description="Razão social, CNPJ e nome fantasia."
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-7 sm:grid-cols-2">
              <TextField
                label="Nome"
                placeholder="Razão social"
                className="sm:col-span-2"
                error={errors.name?.message}
                {...register("name")}
              />

              <Controller
                control={control}
                name="cnpj"
                render={({ field }) => (
                  <TextField
                    label="CNPJ"
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                    className="tabular-nums"
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(event) =>
                      field.onChange(maskCnpj(event.target.value))
                    }
                    error={errors.cnpj?.message}
                    hint={
                      isCnpjValid ? (
                        <span className="text-success">
                          CNPJ válido (módulo 11).
                        </span>
                      ) : undefined
                    }
                  />
                )}
              />

              <TextField
                label="Nome Fantasia"
                placeholder="Como a empresa é conhecida"
                error={errors.tradeName?.message}
                {...register("tradeName")}
              />
            </div>
          </FormSection>

          <FormSection
            stepNumber={2}
            title="Endereço"
            description="Informe o CEP para autocompletar. Todos os campos seguem editáveis."
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-7 md:grid-cols-6">
              <Controller
                control={control}
                name="address.zipCode"
                render={({ field }) => (
                  <TextField
                    label="CEP"
                    placeholder="00000-000"
                    inputMode="numeric"
                    className="col-span-2"
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(event) =>
                      field.onChange(maskZipCode(event.target.value))
                    }
                    error={errors.address?.zipCode?.message}
                    hint={
                      isLoadedZipCodeUntouched ? undefined : (
                        <span className={`flex items-center gap-1.5 ${cepHint.className}`}>
                          {cepLookup.status === "loading" && (
                            <span
                              aria-hidden="true"
                              className="size-2.5 animate-spin rounded-pill border-2 border-border border-t-primary"
                            />
                          )}
                          {cepHint.text}
                        </span>
                      )
                    }
                  />
                )}
              />

              <TextField
                label="Logradouro"
                placeholder="Rua, avenida"
                className="col-span-2 md:col-span-3"
                error={errors.address?.street?.message}
                {...register("address.street")}
              />

              <TextField
                label="Número"
                placeholder="S/N"
                className="col-span-2 md:col-span-1"
                error={errors.address?.number?.message}
                {...register("address.number")}
              />

              <TextField
                label="Complemento"
                placeholder="Sala, andar, bloco"
                isOptional
                className="col-span-2 md:col-span-3"
                error={errors.address?.complement?.message}
                {...register("address.complement")}
              />

              <TextField
                label="Bairro"
                placeholder="Bairro"
                className="col-span-2 md:col-span-3"
                error={errors.address?.neighborhood?.message}
                {...register("address.neighborhood")}
              />

              <TextField
                label="Cidade"
                placeholder="Cidade"
                className="col-span-2 md:col-span-4"
                error={errors.address?.city?.message}
                {...register("address.city")}
              />

              <SelectField
                label="Estado"
                className="col-span-2"
                error={errors.address?.state?.message}
                {...register("address.state")}
              >
                <option value="">UF</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </SelectField>
            </div>
          </FormSection>

          <div className="flex items-center justify-end gap-3 rounded-card border border-border bg-white px-5 py-4 shadow-elevation-1">
            <span className="mr-auto text-[13px] leading-[18px] text-text-muted">
              Validação compartilhada com a API (CompanySchema, Zod).
            </span>
            <Button
              variant="secondary"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : isEditMode
                  ? "Salvar alterações"
                  : "Cadastrar Empresa"}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
