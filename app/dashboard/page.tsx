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

type EditType = "coordinator" | "child" | null;

const classes = [
  "Nursery",
  "LKG",
  "UKG",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const parish = searchParams.get("parish") || "";

  // -----------------------------------------
  // DATA
  // -----------------------------------------

  const [coordinators, setCoordinators] = useState<
    Coordinator[]
  >([]);

  const [children, setChildren] = useState<Child[]>([]);

  // -----------------------------------------
  // LOADING / ERROR
  // -----------------------------------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------
  // ADD COORDINATOR
  // -----------------------------------------

  const [showCoordinatorForm, setShowCoordinatorForm] =
    useState(false);

  const [coordinatorName, setCoordinatorName] =
    useState("");

  const [coordinatorMobile, setCoordinatorMobile] =
    useState("");

  // -----------------------------------------
  // ADD CHILD
  // -----------------------------------------

  const [showChildForm, setShowChildForm] =
    useState(false);

  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");

  const [childGender, setChildGender] =
    useState<"Boy" | "Girl" | "">("");

  const [parentMobile, setParentMobile] =
    useState("");

  // -----------------------------------------
  // EDIT MODAL
  // -----------------------------------------

  const [editType, setEditType] =
    useState<EditType>(null);

  const [editingCoordinator, setEditingCoordinator] =
    useState<Coordinator | null>(null);

  const [editingChild, setEditingChild] =
    useState<Child | null>(null);

  // -----------------------------------------
  // EDIT COORDINATOR
  // -----------------------------------------

  const [editCoordinatorName, setEditCoordinatorName] =
    useState("");

  const [
    editCoordinatorMobile,
    setEditCoordinatorMobile,
  ] = useState("");

  // -----------------------------------------
  // EDIT CHILD
  // -----------------------------------------

  const [editChildName, setEditChildName] =
    useState("");

  const [editChildClass, setEditChildClass] =
    useState("");

  const [editChildGender, setEditChildGender] =
    useState<"Boy" | "Girl" | "">("");

  const [editParentMobile, setEditParentMobile] =
    useState("");

  // -----------------------------------------
  // LOAD REGISTRATION
  // -----------------------------------------

  useEffect(() => {
    async function loadRegistration() {
      if (!parish) {
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

        if (data.registration) {
          setCoordinators(
            data.registration.coordinators || []
          );

          setChildren(
            data.registration.children || []
          );
        } else {
          setCoordinators([]);
          setChildren([]);
        }
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load registration data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegistration();
  }, [parish]);

  // -----------------------------------------
  // ADD COORDINATOR
  // -----------------------------------------

  async function addCoordinator() {
    if (
      !coordinatorName.trim() ||
      !coordinatorMobile.trim()
    ) {
      setError(
        "Please enter coordinator name and mobile number."
      );
      return;
    }

    const newCoordinator: Coordinator = {
      id: Date.now(),
      name: coordinatorName.trim(),
      mobile: coordinatorMobile.trim(),
    };

    try {
      setSaving(true);
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
            action: "addCoordinator",
            coordinator: newCoordinator,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to save coordinator"
        );
      }

      setCoordinators(
        data.registration.coordinators || []
      );

      setCoordinatorName("");
      setCoordinatorMobile("");
      setShowCoordinatorForm(false);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save coordinator. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // ADD CHILD
  // -----------------------------------------

  async function addChild() {
    if (
      !childName.trim() ||
      !childClass ||
      !childGender ||
      !parentMobile.trim()
    ) {
      setError(
        "Please fill in all child details."
      );
      return;
    }

    const newChild: Child = {
      id: Date.now(),
      name: childName.trim(),
      className: childClass,
      gender: childGender,
      parentMobile: parentMobile.trim(),
    };

    try {
      setSaving(true);
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
            action: "addChild",
            child: newChild,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to save child"
        );
      }

      setChildren(
        data.registration.children || []
      );

      setChildName("");
      setChildClass("");
      setChildGender("");
      setParentMobile("");
      setShowChildForm(false);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save child. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // OPEN EDIT COORDINATOR
  // -----------------------------------------

  function openEditCoordinator(
    coordinator: Coordinator
  ) {
    setEditingCoordinator(coordinator);

    setEditCoordinatorName(
      coordinator.name
    );

    setEditCoordinatorMobile(
      coordinator.mobile
    );

    setEditType("coordinator");
    setError("");
  }

  // -----------------------------------------
  // OPEN EDIT CHILD
  // -----------------------------------------

  function openEditChild(child: Child) {
    setEditingChild(child);

    setEditChildName(child.name);
    setEditChildClass(child.className);
    setEditChildGender(child.gender);
    setEditParentMobile(child.parentMobile);

    setEditType("child");
    setError("");
  }

  // -----------------------------------------
  // CLOSE EDIT MODAL
  // -----------------------------------------

  function closeEditModal() {
    setEditType(null);

    setEditingCoordinator(null);
    setEditingChild(null);

    setEditCoordinatorName("");
    setEditCoordinatorMobile("");

    setEditChildName("");
    setEditChildClass("");
    setEditChildGender("");
    setEditParentMobile("");
  }

  // -----------------------------------------
  // SAVE EDITED COORDINATOR
  // -----------------------------------------

  async function saveEditedCoordinator() {
    if (!editingCoordinator) {
      return;
    }

    if (
      !editCoordinatorName.trim() ||
      !editCoordinatorMobile.trim()
    ) {
      setError(
        "Coordinator name and mobile number are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/registrations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            type: "coordinator",
            id: editingCoordinator.id,
            data: {
              name: editCoordinatorName.trim(),
              mobile:
                editCoordinatorMobile.trim(),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to update coordinator"
        );
      }

      setCoordinators(
        data.registration.coordinators || []
      );

      closeEditModal();
    } catch (error) {
      console.error(error);

      setError(
        "Unable to update coordinator. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // SAVE EDITED CHILD
  // -----------------------------------------

  async function saveEditedChild() {
    if (!editingChild) {
      return;
    }

    if (
      !editChildName.trim() ||
      !editChildClass ||
      !editChildGender ||
      !editParentMobile.trim()
    ) {
      setError(
        "Please fill in all child details."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/registrations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            type: "child",
            id: editingChild.id,
            data: {
              name: editChildName.trim(),
              className: editChildClass,
              gender: editChildGender,
              parentMobile:
                editParentMobile.trim(),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to update child"
        );
      }

      setChildren(
        data.registration.children || []
      );

      closeEditModal();
    } catch (error) {
      console.error(error);

      setError(
        "Unable to update child. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // DELETE COORDINATOR
  // -----------------------------------------

  async function deleteCoordinator(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coordinator?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/registrations",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            type: "coordinator",
            id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to delete coordinator"
        );
      }

      setCoordinators(
        data.registration.coordinators || []
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete coordinator. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // DELETE CHILD
  // -----------------------------------------

  async function deleteChild(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this child?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/registrations",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            type: "child",
            id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to delete child"
        );
      }

      setChildren(
        data.registration.children || []
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete child. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // GO TO REVIEW
  // -----------------------------------------

  function goToReview() {
    setError("");

    router.push(
      `/review?parish=${encodeURIComponent(parish)}`
    );
  }

  // -----------------------------------------
  // NO PARISH
  // -----------------------------------------

  if (!parish) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

          <h1 className="text-xl font-bold text-gray-900">
            Parish not selected
          </h1>

          <p className="mt-2 text-gray-500">
            Please return to registration and select
            your parish.
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-5xl">

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

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-4 text-lg font-bold text-red-500"
            >
              ×
            </button>

          </div>
        )}

        {/* PARISH SUMMARY */}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            PARISH
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {parish}
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-blue-50 p-5 text-center">

              <p className="text-3xl font-bold text-blue-600">
                {loading
                  ? "..."
                  : coordinators.length}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-600">
                Coordinators
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5 text-center">

              <p className="text-3xl font-bold text-blue-600">
                {loading
                  ? "..."
                  : children.length}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-600">
                Children
              </p>

            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* COORDINATORS */}
        {/* ================================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Coordinators
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add the coordinators responsible for
                your parish.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowCoordinatorForm(
                  !showCoordinatorForm
                )
              }
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
            >
              {showCoordinatorForm
                ? "Cancel"
                : "+ Add Coordinator"}
            </button>

          </div>

          {/* ADD COORDINATOR */}

          {showCoordinatorForm && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

              <h3 className="font-bold text-gray-900">
                Add Coordinator
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Coordinator Name
                  </label>

                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) =>
                      setCoordinatorName(
                        e.target.value
                      )
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    value={coordinatorMobile}
                    onChange={(e) =>
                      setCoordinatorMobile(
                        e.target.value
                      )
                    }
                    placeholder="Enter mobile number"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              <button
                type="button"
                onClick={addCoordinator}
                disabled={saving}
                className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving
                  ? "Saving..."
                  : "Save Coordinator"}
              </button>

            </div>
          )}

          {/* COORDINATOR LIST */}

          <div className="mt-6">

            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">

                <p className="text-gray-500">
                  Loading coordinators...
                </p>

              </div>
            ) : coordinators.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">

                <p className="text-gray-500">
                  No coordinators added yet.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {coordinators.map(
                  (coordinator, index) => (
                    <div
                      key={coordinator.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="font-semibold text-gray-900">
                            {index + 1}.{" "}
                            {coordinator.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {coordinator.mobile}
                          </p>

                        </div>

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditCoordinator(
                                coordinator
                              )
                            }
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteCoordinator(
                                coordinator.id
                              )
                            }
                            disabled={saving}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:bg-gray-100"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        {/* ================================= */}
        {/* CHILDREN */}
        {/* ================================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Children
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add all participating children from
                your parish.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowChildForm(!showChildForm)
              }
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
            >
              {showChildForm
                ? "Cancel"
                : "+ Add Child"}
            </button>

          </div>

          {/* ADD CHILD */}

          {showChildForm && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

              <h3 className="font-bold text-gray-900">
                Add Child
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Student Name
                  </label>

                  <input
                    type="text"
                    value={childName}
                    onChange={(e) =>
                      setChildName(e.target.value)
                    }
                    placeholder="Enter student's full name"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Class
                  </label>

                  <select
                    value={childClass}
                    onChange={(e) =>
                      setChildClass(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Select class
                    </option>

                    {classes.map((className) => (
                      <option
                        key={className}
                        value={className}
                      >
                        {className}
                      </option>
                    ))}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Gender
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setChildGender("Boy")
                      }
                      className={`rounded-xl border px-4 py-3 font-medium transition ${
                        childGender === "Boy"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Boy
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setChildGender("Girl")
                      }
                      className={`rounded-xl border px-4 py-3 font-medium transition ${
                        childGender === "Girl"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Girl
                    </button>

                  </div>

                </div>

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent's Contact Number
                  </label>

                  <input
                    type="tel"
                    value={parentMobile}
                    onChange={(e) =>
                      setParentMobile(
                        e.target.value
                      )
                    }
                    placeholder="Enter parent's mobile number"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              <button
                type="button"
                onClick={addChild}
                disabled={saving}
                className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving
                  ? "Saving..."
                  : "Save Child"}
              </button>

            </div>
          )}

          {/* CHILD LIST */}

          <div className="mt-6">

            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">

                <p className="text-gray-500">
                  Loading children...
                </p>

              </div>
            ) : children.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">

                <p className="text-gray-500">
                  No children added yet.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {children.map((child, index) => (
                  <div
                    key={child.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

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

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditChild(child)
                          }
                          disabled={saving}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteChild(child.id)
                          }
                          disabled={saving}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:bg-gray-100"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

        {/* ================================= */}
        {/* REVIEW & SUBMIT */}
        {/* ================================= */}

        <button
          type="button"
          onClick={goToReview}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          Review & Submit
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Your information is saved as a draft. You can
          return anytime and continue your registration.
        </p>

      </div>

      {/* ======================================= */}
      {/* EDIT COORDINATOR MODAL */}
      {/* ======================================= */}

      {editType === "coordinator" &&
        editingCoordinator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Coordinator
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update coordinator details.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>

              </div>

              <div className="mt-6 space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Coordinator Name
                  </label>

                  <input
                    type="text"
                    value={editCoordinatorName}
                    onChange={(e) =>
                      setEditCoordinatorName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    value={editCoordinatorMobile}
                    onChange={(e) =>
                      setEditCoordinatorMobile(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              <div className="mt-7 flex gap-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveEditedCoordinator}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ======================================= */}
      {/* EDIT CHILD MODAL */}
      {/* ======================================= */}

      {editType === "child" &&
        editingChild && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Child
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update the child's details.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>

              </div>

              <div className="mt-6 space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Student Name
                  </label>

                  <input
                    type="text"
                    value={editChildName}
                    onChange={(e) =>
                      setEditChildName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Class
                  </label>

                  <select
                    value={editChildClass}
                    onChange={(e) =>
                      setEditChildClass(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Select class
                    </option>

                    {classes.map((className) => (
                      <option
                        key={className}
                        value={className}
                      >
                        {className}
                      </option>
                    ))}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Gender
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setEditChildGender("Boy")
                      }
                      className={`rounded-xl border px-4 py-3 font-medium transition ${
                        editChildGender === "Boy"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Boy
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditChildGender("Girl")
                      }
                      className={`rounded-xl border px-4 py-3 font-medium transition ${
                        editChildGender === "Girl"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Girl
                    </button>

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent's Contact Number
                  </label>

                  <input
                    type="tel"
                    value={editParentMobile}
                    onChange={(e) =>
                      setEditParentMobile(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              <div className="mt-7 flex gap-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveEditedChild}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading dashboard...
            </p>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}