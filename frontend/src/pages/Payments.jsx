import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  FileText,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import "./Payments.css";

const emptyForm = {
  invoice: "",
  amount: "",
  method: "cash",
  reference: "",
  notes: "",
};

const methodClass = (method) => {
  switch (method) {
    case "cash":
      return "cash";
    case "card":
      return "card";
    case "bank":
      return "bank";
    case "mobile_money":
      return "mobile";
    default:
      return "";
  }
};

const formatMethod = (method) =>
  (method || "").replace("_", " ").toUpperCase();

const Payments = () => {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [paymentError, setPaymentError] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentsResponse, invoicesResponse] =
        await Promise.all([
          api.get("/payments"),
          api.get("/invoices"),
        ]);

      setPayments(
        paymentsResponse.data.payments || []
      );
      setInvoices(
        invoicesResponse.data.invoices || []
      );
    } catch (error) {
      console.error("Payment data error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load payment data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setPaymentError("");
  };

  const handleChange = (e) => {
    const newForm = {
      ...form,
      [e.target.name]: e.target.value,
    };
    setForm(newForm);

    // Validate amount against selected invoice balance
    if (
      e.target.name === "amount" ||
      e.target.name === "invoice"
    ) {
      const inv = invoices.find(
        (i) =>
          i._id === (newForm.invoice || form.invoice)
      );
      const amount = Number(newForm.amount || 0);
      const balance = Number(inv?.balance || 0);

      if (amount <= 0) {
        setPaymentError(
          "Amount must be greater than zero"
        );
      } else if (amount > balance) {
        setPaymentError(
          "Amount exceeds remaining invoice balance"
        );
      } else {
        setPaymentError("");
      }
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.invoice || !form.amount) {
      setPaymentError(
        "Invoice and amount are required"
      );
      return;
    }

    try {
      setSavingPayment(true);
      await api.post("/payments", {
        invoiceId: form.invoice,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        notes: form.notes,
      }, {
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
      });

      toast.success("Payment recorded successfully.");
      setError("");

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Record payment error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const totalCollected = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  const unpaidInvoices = invoices.filter(
    (invoice) =>
      Number(invoice.balance || 0) > 0
  );

  const visiblePayments = payments.filter((payment) =>
    [
      payment.invoice?.invoiceNumber,
      payment.customer?.name,
      payment.reference,
      payment.method,
    ]
      .filter(Boolean)
      .some((value) =>
        value
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      )
  );

  const stats = [
    {
      label: "Total Payments",
      value: payments.length,
      icon: CreditCard,
      tone: "blue",
    },
    {
      label: "Total Collected",
      value: `$${totalCollected.toFixed(2)}`,
      icon: TrendingUp,
      tone: "green",
    },
    {
      label: "Outstanding Invoices",
      value: unpaidInvoices.length,
      icon: FileText,
      tone: "orange",
    },
  ];

  return (
    <div className="page-container payments-page">
      <PageHeader eyebrow="Garage Operations" title="Payments" subtitle="Record and manage customer payments.">
        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus size={17} /> Record Payment
            </>
          )}
        </button>
      </PageHeader>

      {error && (
        <div className="error-message">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} />
        ))}
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Record Payment</h2>

          <form
            onSubmit={handleSubmit}
            className="payment-form"
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice</label>
                <select
                  name="invoice"
                  value={form.invoice}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select invoice
                  </option>
                  {unpaidInvoices.map((invoice) => (
                    <option
                      key={invoice._id}
                      value={invoice._id}
                    >
                      {invoice.invoiceNumber} -{" "}
                      {invoice.customer?.name} (
                      Balance:{" "}
                      {formatCurrency(
                        invoice.balance
                      )}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {form.invoice && (
                <div className="form-group">
                  <label>
                    Invoice Summary
                  </label>

                  {(() => {
                    const inv = invoices.find(
                      (i) =>
                        i._id === form.invoice
                    );
                    if (!inv) return null;

                    return (
                      <div className="payment-summary">
                        <div>
                          <span>Invoice Total</span>
                          <strong>
                            {formatCurrency(inv.total)}
                          </strong>
                        </div>

                        <div>
                          <span>Paid</span>
                          <strong>
                            {formatCurrency(
                              inv.amountPaid
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Remaining</span>
                          <strong>
                            {formatCurrency(
                              inv.balance
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>
                            {(
                              inv.paymentStatus ||
                              "unpaid"
                            ).toUpperCase()}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                />
                {paymentError && (
                  <div className="payment-error">
                    <AlertTriangle size={14} />
                    {paymentError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="method"
                  value={form.method}
                  onChange={handleChange}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">
                    Bank Transfer
                  </option>
                  <option value="mobile_money">
                    Mobile Money
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference</label>
                <input
                  type="text"
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="Optional reference"
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional notes"
                  rows="3"
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={savingPayment || !!paymentError}
            >
              <CreditCard size={16} />
              {savingPayment ? "Recording..." : "Record Payment"}
            </button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Payment History</h2>
            <span className="table-caption">
              {visiblePayments.length} payments shown
            </span>
          </div>

          <button
            className="secondary-button"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : visiblePayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={
              payments.length
                ? "No matching payments"
                : "No payments found"
            }
            hint={
              payments.length
                ? "Try another search term."
                : "Recorded payments will appear here."
            }
            action={
              !payments.length ? (
                <button
                  className="primary-button"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Record Payment
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="table-toolbar">
              <div className="search-box compact-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search payments..."
                  aria-label="Search payments"
                />
                {search && (
                  <button
                    className="clear-search"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Received By</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment._id}>
                      <td data-label="Invoice">
                        <strong>
                          {payment.invoice
                            ?.invoiceNumber || "-"}
                        </strong>
                      </td>
                      <td data-label="Customer">
                        {payment.customer?.name ||
                          "-"}
                      </td>
                      <td data-label="Amount">
                        <strong>
                          $
                          {Number(
                            payment.amount || 0
                          ).toFixed(2)}
                        </strong>
                      </td>
                      <td data-label="Method">
                        <span
                          className={`method-badge ${methodClass(
                            payment.method
                          )}`}
                        >
                          {formatMethod(
                            payment.method
                          )}
                        </span>
                      </td>
                      <td data-label="Reference">
                        {payment.reference || "-"}
                      </td>
                      <td data-label="Received By">
                        {payment.receivedBy?.name ||
                          "-"}
                      </td>
                      <td data-label="Date">
                        {new Date(
                          payment.createdAt
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payments;