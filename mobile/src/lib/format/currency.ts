const formatCurrency = (amount: number) => {
  const formatted = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const decimalIndex = formatted.indexOf(".");
  if (decimalIndex === -1) return { dollars: formatted, cents: ".00" };

  const dollars = formatted.substring(0, decimalIndex);
  const cents = formatted.substring(decimalIndex);

  return { dollars, cents };
};

export default formatCurrency;
