import { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import "./Invoices.css";

const Invoices = () => {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [companySettings, setCompanySettings] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/invoices");

      setInvoices(response.data.invoices || []);

      // fetch company settings once
      try {
        const s = await api.get("/settings/company");
        if (s.data?.settings) {
          const cfg = s.data.settings;
          // store in state for use in modal/print
          setCompanySettings(cfg);
        }
      } catch {
        // ignore
      }

      // If navigated here with a newly created invoice, show a notice
      if (location.state?.invoiceId) {
        const created = response.data.invoices.find(
          (i) => i._id === location.state.invoiceId
        );

        if (created) {
          toast.success(
            `Invoice ${location.state.invoiceNumber || created.invoiceNumber} created successfully.`
          );

          // remove state from history so message is one-time
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch (error) {
      console.error("Get invoices error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const totalRevenue = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.amountPaid || 0),
    0
  );

  const totalOutstanding = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.balance || 0),
    0
  );

  const totalInvoices = invoices.length;
  const visibleInvoices = invoices.filter((invoice) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [invoice.invoiceNumber, invoice.customer?.name, invoice.vehicle?.licensePlate]
      .filter(Boolean).some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || invoice.paymentStatus === statusFilter);
  });

  const openInvoice = async (id) => {
    try {
      setError("");
      const response = await api.get(`/invoices/${id}`);

      setSelectedInvoice(response.data.invoice);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error("Open invoice error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to open invoice"
      );
    }
  };

  const closeInvoice = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const printInvoice = (invoice) => {
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body{font-family: Arial, sans-serif; padding:20px; color:#111}
            .header{display:flex;justify-content:space-between;align-items:flex-start}
            .brand{font-weight:800; font-size:20px}
            .muted{color:#666}
            table{width:100%; border-collapse:collapse; margin-top:18px}
            th,td{padding:8px 6px; border-bottom:1px solid #eee}
            th{text-align:left}
            .right{text-align:right}
            .totals{margin-top:12px}
            .totals td{border:0}
            .big{font-size:16px; font-weight:800}
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">${companySettings.companyName || 'GARAGE NAME'}</div>
              <div class="muted">${companySettings.companyAddress || '123 Main Street · City'}</div>
              <div class="muted">Phone: ${companySettings.companyPhone || '0123-456-789'} · Email: ${companySettings.companyEmail || 'info@garage.example'}</div>
            </div>
            <div>
              <div>Invoice #: <strong>${invoice.invoiceNumber}</strong></div>
              <div>Date: <strong>${new Date(invoice.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>

          <hr style="margin:16px 0" />

          <div style="display:flex;gap:30px;">
            <div>
              <strong>Customer</strong>
              <div>${invoice.customer?.name || ''}</div>
              <div class="muted">${invoice.customer?.phone || ''}</div>
            </div>
            <div>
              <strong>Vehicle</strong>
              <div>${invoice.vehicle?.make || ''} ${invoice.vehicle?.model || ''}</div>
              <div class="muted">Plate: ${invoice.vehicle?.licensePlate || ''}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${((invoice.services||[]).map(s => `
                <tr>
                  <td>${s.description || ''}</td>
                  <td class="right">1</td>
                  <td class="right">${(Number(s.cost)||0).toFixed(2)}</td>
                </tr>
              `).join(''))}

              ${((invoice.parts||[]).map(p => `
                <tr>
                  <td>${p.name || (p.part && p.part.name) || ''}</td>
                  <td class="right">${p.quantity || 1}</td>
                  <td class="right">${(Number(p.totalPrice)||0).toFixed(2)}</td>
                </tr>
              `).join(''))}
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td class="right">Subtotal</td>
              <td class="right">${(Number(invoice.subtotal)||0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="right">Tax</td>
              <td class="right">${(Number(invoice.tax)||0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="right">Discount</td>
              <td class="right">${(Number(invoice.discount)||0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="right big">TOTAL</td>
              <td class="right big">${(Number(invoice.total)||0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="right">Paid</td>
              <td class="right">${(Number(invoice.amountPaid)||0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="right">Balance</td>
              <td class="right">${(Number(invoice.balance)||0).toFixed(2)}</td>
            </tr>
          </table>

          <div style="margin-top:18px">Payment Status: <strong>${(invoice.paymentStatus||'unpaid').toUpperCase()}</strong></div>

        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) {
      setError('Please allow popups to print the invoice.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="page-container invoices-page">
      <PageHeader eyebrow="Garage Operations" title="Invoices" subtitle="Manage customer invoices and payments." />

      {error && (
        <div className="error-message">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={FileText} label="Total Invoices" value={totalInvoices} tone="blue" />
        <StatCard icon={Wallet} label="Amount Collected" value={`$${totalRevenue.toFixed(2)}`} tone="green" />
        <StatCard icon={AlertCircle} label="Outstanding" value={`$${totalOutstanding.toFixed(2)}`} tone="orange" />
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>All Invoices</h2>
          <button className="secondary-button" onClick={fetchInvoices} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading invoices..." />
        ) : visibleInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={invoices.length ? "No matching invoices" : "No invoices found"}
            hint={invoices.length ? "Try changing the search or status filter." : "Invoices will appear here when they are created."}
          />
        ) : (
          <>
            <div className="table-toolbar">
              <div className="search-box compact-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice or customer..." aria-label="Search invoices" />{search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</div>
              <label className="filter-select">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="paid">Paid</option><option value="partially_paid">Partially paid</option><option value="unpaid">Unpaid</option></select></label>
            </div>
            <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Job Card</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td data-label="Invoice">
                      <button className="link-button" onClick={() => openInvoice(invoice._id)}>
                        <strong>{invoice.invoiceNumber}</strong>
                      </button>
                    </td>

                    <td data-label="Customer">{invoice.customer?.name || "-"}</td>

                    <td data-label="Vehicle">
                      {invoice.vehicle ? `${invoice.vehicle.make} ${invoice.vehicle.model}` : "-"}
                      <br />
                      <small>{invoice.vehicle?.licensePlate || ""}</small>
                    </td>

                    <td data-label="Job Card">{invoice.jobCard?.complaint || "-"}</td>

                    <td data-label="Total">${Number(invoice.total || 0).toFixed(2)}</td>
                    <td data-label="Paid">${Number(invoice.amountPaid || 0).toFixed(2)}</td>
                    <td data-label="Balance">${Number(invoice.balance || 0).toFixed(2)}</td>

                    <td data-label="Status">
                        <StatusBadge status={invoice.paymentStatus} />
                      </td>

                    <td data-label="Date">{formatDate(invoice.createdAt)}</td>

                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button className="icon-button" title="View invoice" onClick={() => openInvoice(invoice._id)}>
                          <Eye size={15} />
                        </button>
                        <button className="icon-button" title="Print / PDF" onClick={() => printInvoice(invoice)}>
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal invoice-modal">
            <div className="modal-header">
              <div>
                <h2>Invoice {selectedInvoice.invoiceNumber}</h2>
                <p>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="invoice-modal-actions">
                <button className="secondary-button" onClick={() => printInvoice(selectedInvoice)}>
                  <Printer size={15} /> Print / PDF
                </button>
                <button className="modal-close" onClick={closeInvoice} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="invoice-brand">
                <div className="brand">{companySettings.companyName || 'GARAGE NAME'}</div>
                <div className="muted">{companySettings.companyAddress || '123 Main Street · City'}</div>
                <div className="muted">Phone: {companySettings.companyPhone || '0123-456-789'} · Email: {companySettings.companyEmail || 'info@garage.example'}</div>
              </div>

              <div className="invoice-meta">
                <div>
                  <strong>Customer</strong>
                  <div>{selectedInvoice.customer?.name}</div>
                  <div className="text-muted">{selectedInvoice.customer?.phone}</div>
                </div>

                <div>
                  <strong>Vehicle</strong>
                  <div>{selectedInvoice.vehicle?.make} {selectedInvoice.vehicle?.model}</div>
                  <div className="text-muted">Plate: {selectedInvoice.vehicle?.licensePlate}</div>
                </div>
              </div>

              <table className="invoice-lines">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="right">Qty</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.services || []).map((s, i) => (
                    <tr key={`s-${i}`}>
                      <td>{s.description}</td>
                      <td className="right">1</td>
                      <td className="right">${Number(s.cost || 0).toFixed(2)}</td>
                    </tr>
                  ))}

                  {(selectedInvoice.parts || []).map((p, i) => (
                    <tr key={`p-${i}`}>
                      <td>{p.name}</td>
                      <td className="right">{p.quantity}</td>
                      <td className="right">${Number(p.totalPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals">
                <div className="invoice-totals-line">
                  <span>Subtotal</span>
                  <span>${Number(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-totals-line">
                  <span>Tax</span>
                  <span>${Number(selectedInvoice.tax || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-totals-line">
                  <span>Discount</span>
                  <span>${Number(selectedInvoice.discount || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-totals-line total">
                  <span>TOTAL</span>
                  <span>${Number(selectedInvoice.total || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-totals-line">
                  <span>Paid</span>
                  <span>${Number(selectedInvoice.amountPaid || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-totals-line">
                  <span>Balance</span>
                  <span>${Number(selectedInvoice.balance || 0).toFixed(2)}</span>
                </div>

                <div className="invoice-payment-status">
                  Payment Status: <strong>{(selectedInvoice.paymentStatus || 'unpaid').toUpperCase()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
