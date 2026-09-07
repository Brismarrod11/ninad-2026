"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

type Coordinator = {
  id: number;
  name: string;
  mobile: string;
};

type Child = {
  id: number;
  name: string;
  className: string;
  gender: "Boy" | "Girl";
  parentMobile: string;
};

type Parish = {
  id: string;
  name: string;
  registered: boolean;
  status: string;
  registrationCode: string | null;
  coordinatorCount: number;
  childCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  coordinators?: Coordinator[];
  children?: Child[];
};

type Summary = {
  totalParishes: number;
  registered: number;
  submitted: number;
  drafts: number;
  notRegistered: number;
  totalChildren: number;
  totalCoordinators: number;
};

export default function AdminPage() {
  const router = useRouter();

  const [parishes, setParishes] = useState<Parish[]>([]);

  const [summary, setSummary] = useState<Summary>({
    totalParishes: 0,
    registered: 0,
    submitted: 0,
    drafts: 0,
    notRegistered: 0,
    totalChildren: 0,
    totalCoordinators: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD PARISH DATA
  // =====================================================

  async function loadParishes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/parishes",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load parish information."
        );
      }

      setParishes(
        Array.isArray(data.parishes)
          ? data.parishes
          : []
      );

      setSummary({
        totalParishes:
          Number(
            data.summary?.totalParishes
          ) || 0,

        registered:
          Number(
            data.summary?.registered
          ) || 0,

        submitted:
          Number(
            data.summary?.submitted
          ) || 0,

        drafts:
          Number(
            data.summary?.drafts
          ) || 0,

        notRegistered:
          Number(
            data.summary?.notRegistered
          ) || 0,

        totalChildren:
          Number(
            data.summary?.totalChildren
          ) || 0,

        totalCoordinators:
          Number(
            data.summary?.totalCoordinators
          ) || 0,
      });
    } catch (err) {
      console.error(
        "Admin parish loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load parish information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParishes();
  }, []);

  // =====================================================
  // STATUS
  // =====================================================

  function getStatus(
    parish: Parish
  ): string {
    if (!parish.registered) {
      return "Not Registered";
    }

    if (
      parish.status ===
      "submitted"
    ) {
      return "Submitted";
    }

    if (
      parish.status ===
      "draft"
    ) {
      return "Draft";
    }

    return parish.status || "Unknown";
  }

  // =====================================================
  // STATUS STYLE
  // =====================================================

  function getStatusClass(
    parish: Parish
  ): string {
    if (!parish.registered) {
      return "bg-gray-100 text-gray-600";
    }

    if (
      parish.status ===
      "submitted"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      parish.status ===
      "draft"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  // =====================================================
  // DATE
  // =====================================================

  function formatDate(
    value: string | null
  ): string {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =====================================================
  // EXCEL SHEET NAME
  // =====================================================

  function createSheetName(
    parishName: string,
    usedNames: Set<string>
  ): string {
    let name = parishName
      .replace(
        /[:\\/?*\[\]]/g,
        ""
      )
      .trim();

    if (!name) {
      name = "Parish";
    }

    // Excel maximum sheet name length = 31
    name = name.substring(0, 31);

    const originalName = name;

    let counter = 2;

    while (
      usedNames.has(name)
    ) {
      const suffix =
        ` (${counter})`;

      name =
        originalName.substring(
          0,
          31 -
            suffix.length
        ) + suffix;

      counter++;
    }

    usedNames.add(name);

    return name;
  }

  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  async function exportExcel() {
    if (
      exporting ||
      parishes.length === 0
    ) {
      return;
    }

    try {
      setExporting(true);
      setError("");

      // -------------------------------------------------
      // GET COMPLETE REGISTRATION DATA
      // -------------------------------------------------

      const detailedParishes: Parish[] =
        [];

      for (
        const parish of parishes
      ) {
        // -----------------------------------------------
        // PARISH NOT REGISTERED
        // -----------------------------------------------

        if (!parish.registered) {
          detailedParishes.push({
            ...parish,
            coordinators: [],
            children: [],
          });

          continue;
        }

        // -----------------------------------------------
        // REGISTERED PARISH
        // -----------------------------------------------

        try {
          const response =
            await fetch(
              `/api/registrations?parish=${encodeURIComponent(
                parish.name
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (!response.ok) {
            detailedParishes.push({
              ...parish,
              coordinators: [],
              children: [],
            });

            continue;
          }

          const data =
            await response.json();

          /*
           * Support both:
           *
           * data.registration
           *
           * and:
           *
           * data.registrations[0]
           */

          let registration =
            null;

          if (
            data.registration
          ) {
            registration =
              data.registration;
          } else if (
            Array.isArray(
              data.registrations
            ) &&
            data.registrations
              .length > 0
          ) {
            registration =
              data.registrations[0];
          }

          if (
            registration
          ) {
            const coordinators =
              Array.isArray(
                registration.coordinators
              )
                ? registration.coordinators
                : [];

            const children =
              Array.isArray(
                registration.children
              )
                ? registration.children
                : [];

            detailedParishes.push({
              ...parish,

              status:
                registration.status ||
                parish.status,

              registrationCode:
                registration.registrationCode ||
                parish.registrationCode ||
                null,

              coordinators,

              children,

              coordinatorCount:
                coordinators.length,

              childCount:
                children.length,

              createdAt:
                registration.createdAt ||
                parish.createdAt ||
                null,

              updatedAt:
                registration.updatedAt ||
                parish.updatedAt ||
                null,

              submittedAt:
                registration.submittedAt ||
                parish.submittedAt ||
                null,
            });
          } else {
            detailedParishes.push({
              ...parish,
              coordinators: [],
              children: [],
            });
          }
        } catch (err) {
          console.error(
            `Failed to load ${parish.name}:`,
            err
          );

          detailedParishes.push({
            ...parish,
            coordinators: [],
            children: [],
          });
        }
      }

      // -------------------------------------------------
      // CREATE WORKBOOK
      // -------------------------------------------------

      const workbook =
        XLSX.utils.book_new();

      const usedSheetNames =
        new Set<string>();

      // -------------------------------------------------
      // ONE SHEET PER PARISH
      // -------------------------------------------------

      detailedParishes.forEach(
        (parish) => {
          const coordinators =
            parish.coordinators ||
            [];

          const children =
            parish.children ||
            [];

          const rows: (
            string | number
          )[][] = [];

          // =============================================
          // TITLE
          // =============================================

          rows.push([
            "NINAD 2026",
          ]);

          rows.push([
            "CHILDREN'S CONVENTION 2026",
          ]);

          rows.push([]);

          // =============================================
          // PARISH INFORMATION
          // =============================================

          rows.push([
            "PARISH INFORMATION",
          ]);

          rows.push([
            "Parish",
            parish.name,
          ]);

          rows.push([
            "Registration Number",
            parish.registrationCode ||
              "—",
          ]);

          rows.push([
            "Status",
            getStatus(parish),
          ]);

          rows.push([
            "Created",
            parish.createdAt
              ? new Date(
                  parish.createdAt
                ).toLocaleString(
                  "en-IN"
                )
              : "—",
          ]);

          rows.push([
            "Last Updated",
            parish.updatedAt
              ? new Date(
                  parish.updatedAt
                ).toLocaleString(
                  "en-IN"
                )
              : "—",
          ]);

          rows.push([
            "Submitted",
            parish.submittedAt
              ? new Date(
                  parish.submittedAt
                ).toLocaleString(
                  "en-IN"
                )
              : "—",
          ]);

          rows.push([]);

          // =============================================
          // COORDINATORS
          // =============================================

          rows.push([
            "COORDINATORS",
          ]);

          rows.push([
            "No.",
            "Coordinator Name",
            "Mobile",
          ]);

          if (
            coordinators.length ===
            0
          ) {
            rows.push([
              "—",
              "No coordinators registered",
              "",
            ]);
          } else {
            coordinators.forEach(
              (
                coordinator,
                index
              ) => {
                rows.push([
                  index + 1,
                  coordinator.name ||
                    "",
                  coordinator.mobile ||
                    "",
                ]);
              }
            );
          }

          rows.push([]);

          // =============================================
          // CHILDREN
          // =============================================

          rows.push([
            "CHILDREN",
          ]);

          rows.push([
            "No.",
            "Child Name",
            "Class",
            "Gender",
            "Parent Mobile",
          ]);

          if (
            children.length ===
            0
          ) {
            rows.push([
              "—",
              "No children registered",
              "",
              "",
              "",
            ]);
          } else {
            children.forEach(
              (
                child,
                index
              ) => {
                rows.push([
                  index + 1,
                  child.name || "",
                  child.className ||
                    "",
                  child.gender || "",
                  child.parentMobile ||
                    "",
                ]);
              }
            );
          }

          rows.push([]);

          // =============================================
          // SUMMARY
          // =============================================

          rows.push([
            "REGISTRATION SUMMARY",
          ]);

          rows.push([
            "Total Coordinators",
            coordinators.length,
          ]);

          rows.push([
            "Total Children",
            children.length,
          ]);

          // =============================================
          // CREATE SHEET
          // =============================================

          const worksheet =
            XLSX.utils.aoa_to_sheet(
              rows
            );

          // =============================================
          // COLUMN WIDTHS
          // =============================================

          worksheet["!cols"] = [
            {
              wch: 28,
            },
            {
              wch: 34,
            },
            {
              wch: 20,
            },
            {
              wch: 16,
            },
            {
              wch: 24,
            },
          ];

          // =============================================
          // FREEZE TOP ROWS
          // =============================================

          worksheet["!freeze"] = {
            xSplit: 0,
            ySplit: 3,
          };

          // =============================================
          // SHEET NAME
          // =============================================

          const sheetName =
            createSheetName(
              parish.name,
              usedSheetNames
            );

          // =============================================
          // ADD SHEET
          // =============================================

          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetName
          );
        }
      );

      // -------------------------------------------------
      // CHECK WORKBOOK
      // -------------------------------------------------

      if (
        workbook.SheetNames.length ===
        0
      ) {
        throw new Error(
          "No parish sheets were created."
        );
      }

      // -------------------------------------------------
      // GENERATE REAL XLSX FILE
      // -------------------------------------------------

      const excelData =
        XLSX.write(
          workbook,
          {
            bookType: "xlsx",
            type: "array",
            compression: true,
          }
        );

      // -------------------------------------------------
      // CREATE XLSX BLOB
      // -------------------------------------------------

      const blob =
        new Blob(
          [excelData],
          {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );

      // -------------------------------------------------
      // DOWNLOAD
      // -------------------------------------------------

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "NINAD-2026-All-Parishes.xlsx";

      link.style.display =
        "none";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(
          url
        );
      }, 1000);
    } catch (err) {
      console.error(
        "Excel export error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Excel file."
      );
    } finally {
      setExporting(false);
    }
  }

  // =====================================================
  // FILTERED PARISHES
  // =====================================================

  const filteredParishes =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return parishes.filter(
        (parish) => {
          const matchesSearch =
            !searchText ||
            parish.name
              .toLowerCase()
              .includes(
                searchText
              ) ||
            (
              parish.registrationCode ||
              ""
            )
              .toLowerCase()
              .includes(
                searchText
              );

          let matchesStatus =
            true;

          if (
            statusFilter ===
            "submitted"
          ) {
            matchesStatus =
              parish.status ===
              "submitted";
          }

          if (
            statusFilter ===
            "draft"
          ) {
            matchesStatus =
              parish.status ===
              "draft";
          }

          if (
            statusFilter ===
            "not_registered"
          ) {
            matchesStatus =
              !parish.registered;
          }

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      parishes,
      search,
      statusFilter,
    ]);

  // =====================================================
  // FILTER
  // =====================================================

  function changeFilter(
    filter: string
  ) {
    setStatusFilter(filter);
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold tracking-[0.3em] text-blue-600 uppercase">
                Children's Convention 2026
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                NINAD 2026
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Administration Dashboard
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              {/* EXPORT */}

              <button
                type="button"
                onClick={
                  exportExcel
                }
                disabled={
                  loading ||
                  exporting ||
                  parishes.length ===
                    0
                }
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting
                  ? "Creating Excel..."
                  : "↓ Export Excel"}
              </button>

              {/* REFRESH */}

              <button
                type="button"
                onClick={
                  loadParishes
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-7">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

          <SummaryCard
            title="Parishes"
            value={
              summary.totalParishes
            }
            subtitle="Total parishes"
            active={
              statusFilter ===
              "all"
            }
            onClick={() =>
              changeFilter(
                "all"
              )
            }
          />

          <SummaryCard
            title="Registered"
            value={
              summary.registered
            }
            subtitle="Started registration"
          />

          <SummaryCard
            title="Submitted"
            value={
              summary.submitted
            }
            subtitle="Final registrations"
            valueClass="text-green-600"
            active={
              statusFilter ===
              "submitted"
            }
            onClick={() =>
              changeFilter(
                "submitted"
              )
            }
          />

          <SummaryCard
            title="Drafts"
            value={
              summary.drafts
            }
            subtitle="Still being prepared"
            valueClass="text-orange-500"
            active={
              statusFilter ===
              "draft"
            }
            onClick={() =>
              changeFilter(
                "draft"
              )
            }
          />

          <SummaryCard
            title="Pending"
            value={
              summary.notRegistered
            }
            subtitle="Not registered"
            valueClass="text-gray-600"
            active={
              statusFilter ===
              "not_registered"
            }
            onClick={() =>
              changeFilter(
                "not_registered"
              )
            }
          />

          <SummaryCard
            title="Children"
            value={
              summary.totalChildren
            }
            subtitle="Total participants"
            valueClass="text-blue-600"
          />

          <SummaryCard
            title="Coordinators"
            value={
              summary.totalCoordinators
            }
            subtitle="Total coordinators"
            valueClass="text-purple-600"
          />

        </div>

        {/* ================================================= */}
        {/* QUICK FILTERS */}
        {/* ================================================= */}

        <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-wrap gap-3">

            <FilterButton
              label={`All Parishes (${summary.totalParishes})`}
              active={
                statusFilter ===
                "all"
              }
              onClick={() =>
                changeFilter(
                  "all"
                )
              }
            />

            <FilterButton
              label={`Submitted (${summary.submitted})`}
              active={
                statusFilter ===
                "submitted"
              }
              onClick={() =>
                changeFilter(
                  "submitted"
                )
              }
            />

            <FilterButton
              label={`Drafts (${summary.drafts})`}
              active={
                statusFilter ===
                "draft"
              }
              onClick={() =>
                changeFilter(
                  "draft"
                )
              }
            />

            <FilterButton
              label={`Not Registered (${summary.notRegistered})`}
              active={
                statusFilter ===
                "not_registered"
              }
              onClick={() =>
                changeFilter(
                  "not_registered"
                )
              }
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Search Parish
          </label>

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search parish or registration number..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">

              Showing{" "}

              <span className="font-semibold text-gray-900">
                {
                  filteredParishes.length
                }
              </span>

              {" "}of{" "}

              <span className="font-semibold text-gray-900">
                {
                  summary.totalParishes
                }
              </span>

              {" "}parishes

            </p>

            {(search ||
              statusFilter !==
                "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter(
                    "all"
                  );
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* PARISH TABLE */}
        {/* ================================================= */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-5">

            <h2 className="text-xl font-bold text-gray-900">
              Parish Registrations
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Monitor registration progress across all parishes.
            </p>

          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-gray-500">
                Loading parish information...
              </p>

            </div>
          ) : filteredParishes.length ===
            0 ? (
            <div className="px-6 py-16 text-center">

              <p className="font-semibold text-gray-800">
                No parishes found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try another search or filter.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead className="bg-gray-50">

                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                    <th className="px-6 py-4">
                      Parish
                    </th>

                    <th className="px-6 py-4">
                      Registration
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center">
                      Coordinators
                    </th>

                    <th className="px-6 py-4 text-center">
                      Children
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredParishes.map(
                    (parish) => (
                      <tr
                        key={
                          parish.id
                        }
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-semibold text-gray-900">
                            {
                              parish.name
                            }
                          </p>

                        </td>

                        <td className="px-6 py-4">

                          {parish.registrationCode ? (
                            <span className="font-mono text-sm text-gray-700">
                              {
                                parish.registrationCode
                              }
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              parish
                            )}`}
                          >
                            {
                              getStatus(
                                parish
                              )
                            }
                          </span>

                        </td>

                        <td className="px-6 py-4 text-center font-semibold text-gray-800">

                          {parish.registered
                            ? parish.coordinatorCount
                            : "—"}

                        </td>

                        <td className="px-6 py-4 text-center font-semibold text-gray-800">

                          {parish.registered
                            ? parish.childCount
                            : "—"}

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">

                          {formatDate(
                            parish.submittedAt ||
                              parish.updatedAt ||
                              parish.createdAt
                          )}

                        </td>

                        <td className="px-6 py-4 text-right">

                          {parish.registered ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin/details?parish=${encodeURIComponent(
                                    parish.name
                                  )}`
                                )
                              }
                              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              View Details
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No registration
                            </span>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* FOOTER */}

        <p className="py-8 text-center text-xs text-gray-400">
          NINAD 2026 • Administration Panel
        </p>

      </div>
    </main>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  subtitle,
  valueClass = "text-gray-900",
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  valueClass?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-default"
      } ${
        active
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-gray-200"
      }`}
    >
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {subtitle}
      </p>
    </button>
  );
}

// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}