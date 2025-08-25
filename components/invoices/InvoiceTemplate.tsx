"use client";

import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

interface InvoiceData {
  invoice_number: string;
  store_name: string;
  store_logo?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  issue_date: Date;
  due_date: Date;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
  className?: string;
}

export function InvoiceTemplate({ data, className = "" }: InvoiceTemplateProps) {
  const { t } = useTranslations();
  const { locale, direction } = useLocale();

  const formatCurrency = (cents: number) => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    const currencyCode = data.currency || 'USD';
    return new Intl.NumberFormat(config, {
      style: 'currency',
      currency: currencyCode
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    const dateLocale = locale === 'ar' ? ar : enUS;
    return format(date, 'PPP', { locale: dateLocale });
  };

  const isRTL = direction === 'rtl';

  return (
    <div 
      className={`max-w-4xl mx-auto bg-white p-8 shadow-lg ${className}`}
      dir={direction}
      lang={locale}
    >
      {/* Header */}
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start border-b-2 border-gray-300 pb-6 mb-8`}>
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t("invoice")}
          </h1>
          <div className="text-gray-600">
            <p className="text-lg font-semibold">{data.store_name}</p>
            <p className="text-sm">{t("invoiceNumber")}: {data.invoice_number}</p>
            <p className="text-sm">{t("issueDate")}: {formatDate(data.issue_date)}</p>
            <p className="text-sm">{t("dueDate")}: {formatDate(data.due_date)}</p>
          </div>
        </div>
        
        {data.store_logo && (
          <div className={`${isRTL ? 'ml-0 mr-auto' : 'mr-0 ml-auto'}`}>
            <img 
              src={data.store_logo} 
              alt={data.store_name}
              className="h-16 w-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Customer Information */}
      {(data.customer_name || data.customer_email || data.customer_phone) && (
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t("billTo")}
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {data.customer_name && (
              <p className="font-medium text-gray-800">{data.customer_name}</p>
            )}
            {data.customer_email && (
              <p className="text-gray-600">{data.customer_email}</p>
            )}
            {data.customer_phone && (
              <p className="text-gray-600">{data.customer_phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className={`border border-gray-300 px-4 py-3 text-left font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("description")}
              </th>
              <th className={`border border-gray-300 px-4 py-3 text-center font-semibold`}>
                {t("quantity")}
              </th>
              <th className={`border border-gray-300 px-4 py-3 text-right font-semibold ${isRTL ? 'text-left' : 'text-right'}`}>
                {t("unitPrice")}
              </th>
              <th className={`border border-gray-300 px-4 py-3 text-right font-semibold ${isRTL ? 'text-left' : 'text-right'}`}>
                {t("total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {item.description}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  {item.quantity}
                </td>
                <td className={`border border-gray-300 px-4 py-3 text-right ${isRTL ? 'text-left' : 'text-right'}`}>
                  {formatCurrency(item.unit_price_cents)}
                </td>
                <td className={`border border-gray-300 px-4 py-3 text-right ${isRTL ? 'text-left' : 'text-right'}`}>
                  {formatCurrency(item.total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`${isRTL ? 'text-left' : 'text-right'} mb-8`}>
        <div className="inline-block bg-gray-50 p-6 rounded-lg min-w-[300px]">
          <div className="space-y-2">
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between`}>
              <span className="text-gray-600">{t("subtotal")}:</span>
              <span className="font-medium">{formatCurrency(data.subtotal_cents)}</span>
            </div>
            
            {data.tax_cents > 0 && (
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between`}>
                <span className="text-gray-600">{t("tax")}:</span>
                <span className="font-medium">{formatCurrency(data.tax_cents)}</span>
              </div>
            )}
            
            {data.shipping_cents > 0 && (
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between`}>
                <span className="text-gray-600">{t("shipping")}:</span>
                <span className="font-medium">{formatCurrency(data.shipping_cents)}</span>
              </div>
            )}
            
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between pt-2 border-t border-gray-300`}>
              <span className="text-lg font-bold text-gray-800">{t("total")}:</span>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(data.total_cents)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(data.notes || data.terms) && (
        <div className={`border-t border-gray-300 pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          {data.notes && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">{t("notes")}:</h3>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
          
          {data.terms && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">{t("terms")}:</h3>
              <p className="text-gray-600 text-sm">{data.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`mt-12 pt-6 border-t border-gray-300 text-center text-gray-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
        <p>{t("thankYouForYourBusiness")}</p>
        <p className="mt-2">{t("generatedOn")} {formatDate(new Date())}</p>
      </div>
    </div>
  );
}
