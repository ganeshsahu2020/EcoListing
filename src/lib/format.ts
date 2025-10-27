export const fmtMoney = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : "";

export const parseMoney = (s: string) => {
  const onlyDigits = s.replace(/[^\d]/g, "");
  return onlyDigits ? Number(onlyDigits) : undefined;
};
