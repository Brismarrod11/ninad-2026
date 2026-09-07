"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Parish = {
  parishNumber: number;
  name: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParish, setSelectedParish] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParishes() {
      try {
        const response = await fetch("/api/parishes");

        if (!response.ok) {
          throw new Error("Failed to load parishes");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load parishes");
        }

        setParishes(data.parishes);
      } catch (error) {
        console.error(error);
        setError("Unable to load parish list. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadParishes();
  }, []);

  const filteredParishes = parishes.filter((parish) =>
    parish.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectParish(name: string) {
    setSelectedParish(name);
    setSearch("");
    setOpen(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
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

        {/* Registration Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-2xl font-bold text-gray-900">
            Parish Registration
          </h2>

          <p className="mt-2 text-gray-500">
            Select your parish to begin the registration.
          </p>

          {/* Parish Selector */}
          <div className="relative mt-8">

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Parish Name
            </label>

            <button
              type="button"
              onClick={() => !loading && !error && setOpen(!open)}
              disabled={loading || !!error}
              className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <span
                className={
                  selectedParish
                    ? "text-gray-900"
                    : "text-gray-400"
                }
              >
                {loading
                  ? "Loading parishes..."
                  : selectedParish || "Select your parish"}
              </span>

              <span
                className={`text-gray-400 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

                {/* Search inside dropdown */}
                <div className="border-b border-gray-200 p-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Type parish name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Parish List */}
                <div className="max-h-64 overflow-y-auto">

                  {filteredParishes.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      No parish found.
                    </div>
                  ) : (
                    filteredParishes.map((parish) => (
                      <button
                        key={parish.name}
                        type="button"
                        onClick={() => selectParish(parish.name)}
                        className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${
                          selectedParish === parish.name
                            ? "bg-blue-50 font-semibold text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {parish.name}
                      </button>
                    ))
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Selected Parish */}
          {selectedParish && (
            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-600">
                Selected Parish
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {selectedParish}
              </p>
            </div>
          )}

          {/* Continue */}
          <button
            disabled={!selectedParish || loading || !!error}
            onClick={() => {
              if (selectedParish) {
                router.push(
                  `/dashboard?parish=${encodeURIComponent(selectedParish)}`
                );
              }
            }}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Continue
          </button>

        </div>

      </div>
    </main>
  );
}