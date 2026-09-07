"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const parish = searchParams.get("parish") || "";

  const [coordinators, setCoordinators] = useState<
    Coordinator[]
  >([]);

  const [children, setChildren] = useState<Child[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [registrationCode, setRegistrationCode] =
    useState("");

  useEffect(() => {
    async function loadRegistration() {
      if (!parish) {
        setError("Parish not selected.");
        setLoading(false);
        return;
      }

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

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to load registration"
          );
        }

        if (!data.registration) {
          setError(
            "No registration data found for this parish."
          );
          return;
        }

        setCoordinators(
          data.registration.coordinators || []
        );

        setChildren(
          data.registration.children || []
        );
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load registration. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegistration();
  }, [parish]);

  async function confirmSubmit() {
    const confirmed = window.confirm(
      "Are you sure you want to submit this registration? Once submitted, the registration will be finalized."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        "/api/registrations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            action: "submit",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to submit registration"
        );
      }

      setSubmitted(true);

      setRegistrationCode(
        data.registrationCode ||
          data.registration?.registrationCode ||
          ""
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit registration."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">

          <div className="mb-8 text-center">

            <p className="text-sm font-semibold tracking-[0.3em] text-blue-600 uppercase">
              Children's Convention 2026
            </p>

            <h1 className="mt-3 text-4xl font-bold text-gray-900">
              NINAD 2026
            </h1>

            <h2 className="mt-2 text-2xl font-semibold text-blue-600">
              BHURGYALEM FEST
            </h2>

          </div>

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl text-green-600">
                ✓
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Registration Submitted
            </h2>

            <p className="mt-3 text-gray-500">
              The registration for{" "}
              <span className="font-semibold text-gray-900">
                {parish}
              </span>{" "}
              has been successfully submitted.
            </p>

            {registrationCode && (
              <div className="mt-6 rounded-xl bg-blue-50 p-5">

                <p className="text-sm text-blue-600">
                  Registration Number
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {registrationCode}
                </p>

              </div>
            )}

            <p className="mt-6 text-sm text-gray-400">
              Please keep your registration number for
              future reference.
            </p>

          </div>

        </div>
      </main>
    );
  }

  if (!parish) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

          <h1 className="text-xl font-bold text-gray-900">
            Parish not selected
          </h1>

          <p className="mt-2 text-gray-500">
            Please return to the registration page.
          </p>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <p className="text-sm font-semibold tracking-[0.3em] text-blue-600 uppercase">
            Children's Convention 2026
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            NINAD 2026
          </h1>

          <h2 className="mt-1 text-2xl font-semibold text-blue-600">
            BHURGYALEM FEST
          </h2>

        </div>

        {/* TITLE */}

        <div className="mb-6 text-center">

          <h2 className="text-2xl font-bold text-gray-900">
            Review Registration
          </h2>

          <p className="mt-2 text-gray-500">
            Please check all details carefully before
            submitting.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <p className="text-gray-500">
              Loading registration...
            </p>

          </div>
        ) : (
          <>
            {/* PARISH */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-gray-500">
                PARISH
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {parish}
              </h2>

            </div>

            {/* COORDINATORS */}

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Coordinators
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {coordinators.length} coordinator
                    {coordinators.length !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard?parish=${encodeURIComponent(
                        parish
                      )}`
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>

              </div>

              {coordinators.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center">

                  <p className="text-gray-500">
                    No coordinators added.
                  </p>

                </div>
              ) : (
                <div className="mt-5 space-y-3">

                  {coordinators.map(
                    (coordinator, index) => (
                      <div
                        key={coordinator.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >

                        <p className="font-semibold text-gray-900">
                          {index + 1}.{" "}
                          {coordinator.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {coordinator.mobile}
                        </p>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* CHILDREN */}

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Children
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {children.length} child
                    {children.length !== 1
                      ? "ren"
                      : ""}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard?parish=${encodeURIComponent(
                        parish
                      )}`
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>

              </div>

              {children.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center">

                  <p className="text-gray-500">
                    No children added.
                  </p>

                </div>
              ) : (
                <div className="mt-5 space-y-3">

                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="font-semibold text-gray-900">
                            {index + 1}. {child.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {child.className} •{" "}
                            {child.gender}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Parent:{" "}
                            {child.parentMobile}
                          </p>

                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* SUMMARY */}

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <h2 className="font-bold text-gray-900">
                Registration Summary
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4">

                <div className="rounded-xl bg-white p-4 text-center">

                  <p className="text-2xl font-bold text-blue-600">
                    {coordinators.length}
                  </p>

                  <p className="text-sm text-gray-500">
                    Coordinators
                  </p>

                </div>

                <div className="rounded-xl bg-white p-4 text-center">

                  <p className="text-2xl font-bold text-blue-600">
                    {children.length}
                  </p>

                  <p className="text-sm text-gray-500">
                    Children
                  </p>

                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard?parish=${encodeURIComponent(
                      parish
                    )}`
                  )
                }
                disabled={submitting}
                className="rounded-xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                ← Back & Edit
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                disabled={
                  submitting ||
                  coordinators.length === 0 ||
                  children.length === 0
                }
                className="rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {submitting
                  ? "Submitting..."
                  : "Confirm & Submit"}
              </button>

            </div>

            <p className="mt-4 text-center text-sm text-gray-400">
              Please make sure all coordinator and child
              details are correct before submitting.
            </p>
          </>
        )}

      </div>

    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading review...
            </p>
          </div>
        </main>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}