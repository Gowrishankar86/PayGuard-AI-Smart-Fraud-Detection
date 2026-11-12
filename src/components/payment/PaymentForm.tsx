import { useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { DeviceType } from '@/lib/riskEngine';
import type { TransactionDraft } from '@/lib/transactions';
import { cardClass, inputClass, labelClass, primaryButtonClass } from '@/components/ui';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'SG', name: 'Singapore' },
  { code: 'NG', name: 'Nigeria' },
];

interface FormValues {
  merchantName: string;
  itemDescription: string;
  amount: string;
  paymentCountry: string;
  deviceType: DeviceType;
  isNewDevice: boolean;
  accountAgeDays: string;
  transactionsLast24h: string;
}

const EMPTY_VALUES: FormValues = {
  merchantName: '',
  itemDescription: '',
  amount: '',
  paymentCountry: 'US',
  deviceType: 'desktop',
  isNewDevice: false,
  accountAgeDays: '',
  transactionsLast24h: '',
};

const SAMPLES: { label: string; hint: string; values: FormValues }[] = [
  {
    label: 'Low risk sample',
    hint: 'Established account, familiar device',
    values: {
      merchantName: 'Northwind Books',
      itemDescription: 'Paperback bundle',
      amount: '42.50',
      paymentCountry: 'US',
      deviceType: 'desktop',
      isNewDevice: false,
      accountAgeDays: '820',
      transactionsLast24h: '1',
    },
  },
  {
    label: 'Medium risk sample',
    hint: 'Young account, new device',
    values: {
      merchantName: 'Lumen Electronics',
      itemDescription: 'Wireless headphones',
      amount: '480.00',
      paymentCountry: 'GB',
      deviceType: 'mobile',
      isNewDevice: true,
      accountAgeDays: '60',
      transactionsLast24h: '6',
    },
  },
  {
    label: 'High risk sample',
    hint: 'New account, burst of payments',
    values: {
      merchantName: 'Quickcash Gadgets',
      itemDescription: 'Gift cards x10',
      amount: '2400.00',
      paymentCountry: 'NG',
      deviceType: 'mobile',
      isNewDevice: true,
      accountAgeDays: '9',
      transactionsLast24h: '12',
    },
  },
];

interface PaymentFormProps {
  submitting: boolean;
  onSubmit: (draft: TransactionDraft) => void;
}

function parseDraft(values: FormValues): TransactionDraft | string {
  const amount = Number(values.amount);
  const accountAgeDays = Number(values.accountAgeDays);
  const transactionsLast24h = Number(values.transactionsLast24h);
  const merchantName = values.merchantName.trim();

  if (!merchantName) return 'Enter the merchant name.';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return 'Enter an amount between $0.01 and $1,000,000.';
  if (!Number.isInteger(accountAgeDays) || accountAgeDays < 0 || accountAgeDays > 36500) return 'Enter the account age in whole days.';
  if (!Number.isInteger(transactionsLast24h) || transactionsLast24h < 0 || transactionsLast24h > 1000) {
    return 'Enter how many payments were made in the last 24 hours.';
  }

  return {
    merchantName,
    itemDescription: values.itemDescription.trim(),
    amount: Math.round(amount * 100) / 100,
    paymentCountry: values.paymentCountry,
    deviceType: values.deviceType,
    isNewDevice: values.isNewDevice,
    accountAgeDays,
    transactionsLast24h,
    localHour: new Date().getHours(),
  };
}

export function PaymentForm({ submitting, onSubmit }: PaymentFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseDraft(values);
    if (typeof parsed === 'string') {
      setError(parsed);
      return;
    }
    setError(null);
    onSubmit(parsed);
  };

  return (
    <div className={cardClass}>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Payment details</h2>
        <p className="mt-1 text-sm text-slate-600">Enter the payment and account details to run a risk check before checkout.</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Try a sample</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SAMPLES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setValues(sample.values);
                setError(null);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="block text-sm font-semibold text-slate-900">{sample.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{sample.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label htmlFor="merchant" className={labelClass}>Merchant</label>
            <input id="merchant" value={values.merchantName} maxLength={120} required className={inputClass}
              onChange={(e) => update('merchantName', e.target.value)} />
          </div>
          <div>
            <label htmlFor="amount" className={labelClass}>Amount (USD)</label>
            <input id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required value={values.amount}
              className={inputClass} onChange={(e) => update('amount', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="item" className={labelClass}>What are you paying for?</label>
            <input id="item" value={values.itemDescription} maxLength={240} className={inputClass}
              onChange={(e) => update('itemDescription', e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <legend className="sr-only">Account and device</legend>
          <div>
            <label htmlFor="country" className={labelClass}>Payment country</label>
            <select id="country" value={values.paymentCountry} className={inputClass}
              onChange={(e) => update('paymentCountry', e.target.value)}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="device" className={labelClass}>Device</label>
            <select id="device" value={values.deviceType} className={inputClass}
              onChange={(e) => update('deviceType', e.target.value as DeviceType)}>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label htmlFor="age" className={labelClass}>Account age (days)</label>
            <input id="age" type="number" min="0" step="1" required value={values.accountAgeDays} className={inputClass}
              onChange={(e) => update('accountAgeDays', e.target.value)} />
          </div>
          <div>
            <label htmlFor="velocity" className={labelClass}>Payments in the last 24 hours</label>
            <input id="velocity" type="number" min="0" step="1" required value={values.transactionsLast24h} className={inputClass}
              onChange={(e) => update('transactionsLast24h', e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 sm:col-span-2">
            <input type="checkbox" checked={values.isNewDevice}
              onChange={(e) => update('isNewDevice', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            This payment is from a device I have not used on this account before
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Run risk check
            </>
          )}
        </button>
      </form>
    </div>
  );
}
