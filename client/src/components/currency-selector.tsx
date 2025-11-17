import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CURRENCIES = [
  { symbol: "£", name: "British Pound (GBP)", code: "GBP" },
  { symbol: "$", name: "US Dollar (USD)", code: "USD" },
  { symbol: "€", name: "Euro (EUR)", code: "EUR" },
  { symbol: "¥", name: "Japanese Yen (JPY)", code: "JPY" },
  { symbol: "₹", name: "Indian Rupee (INR)", code: "INR" },
  { symbol: "C$", name: "Canadian Dollar (CAD)", code: "CAD" },
  { symbol: "A$", name: "Australian Dollar (AUD)", code: "AUD" },
  { symbol: "CHF", name: "Swiss Franc (CHF)", code: "CHF" },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  testId?: string;
}

export default function CurrencySelector({
  value,
  onChange,
  label = "Currency",
  testId = "select-currency",
}: CurrencySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={testId}>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem
              key={currency.symbol}
              value={currency.symbol}
              data-testid={`option-currency-${currency.code}`}
            >
              {currency.symbol} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
