import { useEffect, useState } from "react";
import { Download, RefreshCw, RotateCcw } from "lucide-react";
import api from "../services/api";
import Avatar from "../components/Avatar";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import "./Reports.css";

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit, setInventoryLimit] = useState(10);
  const [partsPage, setPartsPage] = useState(1);
  const [partsLimit, setPartsLimit] = useState(10);
  const [error, setError] = useState("");

  const fetchReports = async (opts = {}) => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (opts.startDate) params.startDate = opts.startDate;
      if (opts.endDate) params.endDate = opts.endDate;
      // pagination params
      params.inventoryPage = opts.inventoryPage || inventoryPage;
      params.inventoryLimit = opts.inventoryLimit || inventoryLimit;
      params.partsPage = opts.partsPage || partsPage;
      params.partsLimit = opts.partsLimit || partsLimit;
      const res = await api.get("/reports", { params });
      setData(res.data);
    } catch (err) {
      console.error("Reports error:", err);
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      setError("");
      const res = await api.get("/reports/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data])
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "reports.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error", err);
      setError(
        err.response?.data?.message ||
          "Failed to export reports"
      );
    }
  };

  const { financial, operations, inventory, mechanics } =
    data || {};

  return (
    <div className="page-container reports-page">
      <PageHeader
        eyebrow="GARAGE INSIGHTS"
        title="Reports"
        subtitle="Track financial performance, workshop operations, and inventory health."
      >
        <button
          className="secondary-button"
          onClick={() => fetchReports({ startDate, endDate })}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </PageHeader>

      <div className="report-filter-card">
        <div className="report-date-field">
          <label htmlFor="report-start">From</label>
          <input
            id="report-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="report-date-field">
          <label htmlFor="report-end">To</label>
          <input
            id="report-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setInventoryPage(1);
            setPartsPage(1);
            fetchReports({
              startDate,
              endDate,
              inventoryPage: 1,
              partsPage: 1,
            });
          }}
        >
          Apply range
        </button>

        <button
          className="secondary-button"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setInventoryPage(1);
            setPartsPage(1);
            fetchReports({
              inventoryPage: 1,
              partsPage: 1,
            });
          }}
        >
          <RotateCcw size={16} /> Reset
        </button>

        <button
          className="secondary-button"
          onClick={handleExport}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchReports({ startDate, endDate })}
        />
      )}

      {loading ? (
        <LoadingState label="Loading reports..." />
      ) : !data ? (
        <EmptyState
          title="Reports unavailable"
          hint="No report data could be loaded for the selected range."
        />
      ) : (
        <>
          {/* Inventory pagination controls */}
          <div className="report-pagination-card">
            <div className="pagination-group">
              <label>Inventory</label>
              <button
                onClick={() => {
                  if (inventoryPage > 1) {
                    setInventoryPage(
                      inventoryPage - 1
                    );
                    fetchReports({
                      startDate,
                      endDate,
                      inventoryPage:
                        inventoryPage - 1,
                      partsPage,
                    });
                  }
                }}
                disabled={inventoryPage <= 1}
              >
                Prev
              </button>
              <span>Page {inventoryPage}</span>
              <button
                onClick={() => {
                  setInventoryPage(
                    inventoryPage + 1
                  );
                  fetchReports({
                    startDate,
                    endDate,
                    inventoryPage:
                      inventoryPage + 1,
                    partsPage,
                  });
                }}
              >
                Next
              </button>
            </div>

            <div className="pagination-group">
              <label>Rows</label>
              <select
                value={inventoryLimit}
                onChange={(e) => {
                  setInventoryLimit(
                    Number(e.target.value)
                  );
                  setInventoryPage(1);
                  fetchReports({
                    startDate,
                    endDate,
                    inventoryPage: 1,
                    inventoryLimit: Number(
                      e.target.value
                    ),
                  });
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="pagination-group">
              <label>Parts usage</label>
              <button
                onClick={() => {
                  if (partsPage > 1) {
                    setPartsPage(partsPage - 1);
                    fetchReports({
                      startDate,
                      endDate,
                      inventoryPage,
                      partsPage: partsPage - 1,
                    });
                  }
                }}
                disabled={partsPage <= 1}
              >
                Prev
              </button>
              <span>Page {partsPage}</span>
              <button
                onClick={() => {
                  setPartsPage(partsPage + 1);
                  fetchReports({
                    startDate,
                    endDate,
                    inventoryPage,
                    partsPage: partsPage + 1,
                  });
                }}
              >
                Next
              </button>
            </div>

            <div className="pagination-group">
              <label>Rows</label>
              <select
                value={partsLimit}
                onChange={(e) => {
                  setPartsLimit(Number(e.target.value));
                  setPartsPage(1);
                  fetchReports({
                    startDate,
                    endDate,
                    partsPage: 1,
                    partsLimit: Number(e.target.value),
                  });
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          <section className="report-card">
            <h2>Financial</h2>
            <div className="report-grid">
              <div>Daily revenue</div>
              <div className="report-value">
                ${financial.dailyRevenue}
              </div>

              <div>Weekly revenue</div>
              <div className="report-value">
                ${financial.weeklyRevenue}
              </div>

              <div>Monthly revenue</div>
              <div className="report-value">
                ${financial.monthlyRevenue}
              </div>

              <div>Outstanding payments</div>
              <div className="report-value">
                ${financial.outstandingPayments}
              </div>

              <div>Paid invoices</div>
              <div className="report-value">
                {financial.paidInvoices}
              </div>

              <div>Unpaid invoices</div>
              <div className="report-value danger">
                {financial.unpaidInvoices}
              </div>
            </div>
          </section>

          <section className="report-card">
            <h2>Operations</h2>
            <div className="report-grid">
              <div>Total jobs</div>
              <div className="report-value">
                {operations.totalJobs}
              </div>

              <div>Completed jobs</div>
              <div className="report-value good">
                {operations.completedJobs}
              </div>

              <div>Cancelled jobs</div>
              <div className="report-value danger">
                {operations.cancelledJobs}
              </div>

              <div>Average job value</div>
              <div className="report-value">
                $
                {Number(
                  operations.averageJobValue || 0
                ).toFixed(2)}
              </div>
            </div>

            <h3 className="report-section-title">
              Most serviced vehicles
            </h3>
            <ul className="list-plain">
              {operations.mostServicedVehicles.map(
                (v) => (
                  <li key={v.vehicleId}>
                    <strong>
                      {v.make} {v.model}
                    </strong>{" "}
                    ({v.licensePlate}) —{" "}
                    {v.count} jobs
                  </li>
                )
              )}
            </ul>
          </section>

          <section className="report-card">
            <h2>Inventory</h2>
            <div className="report-grid">
              <div>Current stock</div>
              <div className="report-value">
                {inventory.currentStockTotal} parts
              </div>

              <div>Low-stock parts</div>
              <div className="report-value warning">
                {inventory.lowStockParts.length}
              </div>

              <div>Parts consumed (distinct)</div>
              <div className="report-value">
                {inventory.partsConsumedTotal}
              </div>

              <div>Inventory value</div>
              <div className="report-value">
                ${inventory.inventoryValue}
              </div>
            </div>

            <h3 className="report-section-title">
              Top consumed parts
            </h3>
            <ul className="list-plain">
              {inventory.partsConsumed.map((p) => (
                <li key={p.partId}>
                  <strong>{p.name}</strong> —{" "}
                  {p.consumed} used
                </li>
              ))}
            </ul>
          </section>

          <section className="report-card">
            <h2>Mechanics</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mechanic</th>
                    <th>Assigned</th>
                    <th>In Progress</th>
                    <th>Completed</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {mechanics.map((m) => (
                    <tr
                      key={m.mechanicId || m.name}
                    >
                      <td data-label="Mechanic">
                        <div className="report-mechanic">
                          <Avatar name={m.name} size={32} />
                          {m.name}
                        </div>
                      </td>
                      <td data-label="Assigned">{m.jobsAssigned}</td>
                      <td data-label="In Progress">{m.jobsInProgress}</td>
                      <td data-label="Completed">{m.jobsCompleted}</td>
                      <td data-label="Revenue" className="report-value">
                        ${m.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Reports;