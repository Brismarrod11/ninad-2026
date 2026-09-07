"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Coordinator = {
  id?: number;
  name: string;
  mobile: string;
};

type Child = {
  id?: number;
  name: string;
  className: string;
  gender: string;
  parentMobile: string;
};

type Registration = {
  parish: string;
  status: string;
  registrationCode?: string;
  coordinators?: Coordinator[];
  children?: Child[];
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
};

function ParishDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const parish =
    searchParams.get("parish") || "";

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!parish) {
      setError("Parish name is missing.");
      setLoading(false);
      return;
    }

    loadRegistration();
  }, [parish]);

  async function loadRegistration() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/registrations?parish=${encodeURIComponent(
          parish
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load registration."
        );
      }

      let result = null;

      if (data.registration) {
        result = data.registration;
      } else if (
        Array.isArray(data.registrations) &&
        data.registrations.length > 0
      ) {
        result = data.registrations[0];
      }

      if (!result) {
        throw new Error(
          "No registration found for this parish."
        );
      }

      setRegistration(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load registration."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(
    value?: string
  ) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getStatusLabel(
    status?: string
  ) {
    if (status === "submitted") {
      return "Submitted";
    }

    if (status === "draft") {
      return "Draft";
    }

    return status || "Unknown";
  }

  function getStatusClass(
    status?: string
  ) {
    if (status === "submitted") {
      return "bg-green-100 text-green-700";
    }

    if (status === "draft") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="flex min-h-screen items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading parish details...
            </p>

          </div>

        </div>

      </main>
    );
  }

  if (error || !registration) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-3xl px-6 py-16">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h1 className="text-xl font-bold text-red-800">
              Unable to load registration
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                "Registration not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ← Back to Admin
            </button>

          </div>

        </div>

      </main>
    );
  }

  const coordinators =
    registration.coordinators || [];

  const children =
    registration.children || [];

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-gray-200 bg-white print:hidden">

        <div className="mx-auto max-w-7xl px-6 py-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <button
                type="button"
                onClick={() =>
                  router.push("/admin")
                }
                className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                ← Back to Admin
              </button>

              <h1 className="text-3xl font-bold text-gray-900">
                {registration.parish ||
                  parish}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Parish Registration Details
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={
                  loadRegistration
                }
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                onClick={
                  handlePrint
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                🖨 Print
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* PRINT HEADER */}
      {/* ================================================= */}

      <div className="hidden print:block">

        <div className="border-b border-gray-300 pb-4">

          <h1 className="text-2xl font-bold">
            NINAD 2026
          </h1>

          <p className="text-sm">
            Children's Convention 2026
          </p>

        </div>

      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-7 print:px-0">

        {/* ================================================= */}
        {/* REGISTRATION HEADER CARD */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-col gap-5 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Parish Registration
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {registration.parish ||
                  parish}
              </h2>

              <p className="mt-2 font-mono text-sm text-gray-500">
                {registration.registrationCode ||
                  "No registration number"}
              </p>

            </div>

            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                registration.status
              )}`}
            >
              {getStatusLabel(
                registration.status
              )}
            </span>

          </div>

          {/* REGISTRATION INFORMATION */}

          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <InfoItem
              label="Registration Number"
              value={
                registration.registrationCode ||
                "—"
              }
            />

            <InfoItem
              label="Status"
              value={getStatusLabel(
                registration.status
              )}
            />

            <InfoItem
              label="Created"
              value={formatDate(
                registration.createdAt
              )}
            />

            <InfoItem
              label="Submitted"
              value={formatDate(
                registration.submittedAt
              )}
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Coordinators
            </p>

            <p className="mt-2 text-4xl font-bold text-purple-600">
              {coordinators.length}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Registered coordinators
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Children
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-600">
              {children.length}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Registered participants
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* COORDINATORS */}
        {/* ================================================= */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-xl font-bold text-gray-900">
              Coordinators
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              People responsible for this parish registration.
            </p>

          </div>

          {coordinators.length ===
          0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No coordinators registered.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                    <th className="px-6 py-4">
                      No.
                    </th>

                    <th className="px-6 py-4">
                      Coordinator Name
                    </th>

                    <th className="px-6 py-4">
                      Mobile
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {coordinators.map(
                    (
                      coordinator,
                      index
                    ) => (
                      <tr
                        key={
                          coordinator.id ??
                          index
                        }
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {
                            coordinator.name
                          }
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {
                            coordinator.mobile
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* CHILDREN */}
        {/* ================================================= */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-xl font-bold text-gray-900">
              Children
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete participant information submitted by the parish.
            </p>

          </div>

          {children.length ===
          0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No children registered.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                    <th className="px-6 py-4">
                      No.
                    </th>

                    <th className="px-6 py-4">
                      Child Name
                    </th>

                    <th className="px-6 py-4">
                      Class
                    </th>

                    <th className="px-6 py-4">
                      Gender
                    </th>

                    <th className="px-6 py-4">
                      Parent Mobile
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {children.map(
                    (
                      child,
                      index
                    ) => (
                      <tr
                        key={
                          child.id ??
                          index
                        }
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {
                            child.name
                          }
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {
                            child.className
                          }
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {
                              child.gender
                            }
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {
                            child.parentMobile
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="py-8 text-center text-xs text-gray-400 print:hidden">
          NINAD 2026 • Administration Panel
        </div>

      </div>

    </main>
  );
}

export default function ParishDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-4 text-sm text-gray-500">
                Loading parish details...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ParishDetailsContent />
    </Suspense>
  );
}

// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}