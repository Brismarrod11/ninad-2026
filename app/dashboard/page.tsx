"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

type Coordinator = {
  name: string;
  mobile: string;
  email?: string;
};

type Child = {
  name: string;
  className: string;
  gender: string;
  parentMobile: string;
  category?: string;
};

type Registration = {
  _id?: string;
  parish: string;
  coordinators: Coordinator[];
  children: Child[];
  submitted?: boolean;
  registrationCode?: string;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedParish =
    searchParams.get("parish") || "";

  const [parish, setParish] = useState("");
  const [authChecking, setAuthChecking] =
    useState(true);

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coordinatorName, setCoordinatorName] =
    useState("");
  const [coordinatorMobile, setCoordinatorMobile] =
    useState("");
  const [coordinatorEmail, setCoordinatorEmail] =
    useState("");

  const [childName, setChildName] =
    useState("");
  const [childClass, setChildClass] =
    useState("");
  const [childGender, setChildGender] =
    useState("");

  const [parentMobile, setParentMobile] =
    useState("");

  const [editingType, setEditingType] =
    useState<"coordinator" | "child" | null>(null);
  const [editingIndex, setEditingIndex] =
    useState<number | null>(null);
  const [editName, setEditName] =
    useState("");
  const [editMobile, setEditMobile] =
    useState("");
  const [editEmail, setEditEmail] =
    useState("");
  const [editClass, setEditClass] =
    useState("");
  const [editGender, setEditGender] =
    useState("");
  const [editParentMobile, setEditParentMobile] =
    useState("");
  const [savingEdit, setSavingEdit] =
    useState(false);

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

  /*
   * VERIFY PARISH SESSION
   *
   * The parish in the URL is NOT trusted.
   * The server-side session decides which parish
   * this browser is allowed to access.
   */
  useEffect(() => {
    async function verifyParishAccess() {
      try {
        const response = await fetch(
          "/api/parish-auth/session",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          router.replace("/register");
          return;
        }

        /*
         * If somebody changes:
         *
         * ?parish=Another Parish
         *
         * redirect them back to their authenticated parish.
         */
        if (
          requestedParish &&
          data.parish !== requestedParish
        ) {
          router.replace(
            `/dashboard?parish=${encodeURIComponent(
              data.parish
            )}`
          );
          return;
        }

        setParish(data.parish);
      } catch (error) {
        console.error(
          "Parish session verification error:",
          error
        );

        router.replace("/register");
      } finally {
        setAuthChecking(false);
      }
    }

    verifyParishAccess();
  }, [requestedParish, router]);

  /*
   * LOAD REGISTRATION
   */
  useEffect(() => {
    if (!parish || authChecking) {
      return;
    }

    async function loadRegistration() {
      setLoading(true);
      setError("");

      try {
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
            data.error ||
              "Unable to load registration."
          );
        }

        setRegistration(
          data.registration || null
        );
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load registration."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegistration();
  }, [parish, authChecking]);

  /*
   * ADD COORDINATOR
   */
  async function addCoordinator() {
    setError("");

    if (!coordinatorName.trim()) {
      setError("Please enter coordinator name.");
      return;
    }

    if (!coordinatorMobile.trim()) {
      setError("Please enter coordinator mobile number.");
      return;
    }

    try {
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
            coordinator: {
              name: coordinatorName.trim(),
              mobile: coordinatorMobile.trim(),
              email:
                coordinatorEmail.trim() || "",
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to add coordinator."
        );
      }

      setRegistration(data.registration);

      setCoordinatorName("");
      setCoordinatorMobile("");
      setCoordinatorEmail("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to add coordinator."
      );
    }
  }

  /*
   * ADD CHILD
   */
  async function addChild() {
    setError("");

    if (!childName.trim()) {
      setError("Please enter child name.");
      return;
    }

    if (!childClass.trim()) {
      setError("Please select child's class.");
      return;
    }

    if (!childGender.trim()) {
      setError("Please select child gender.");
      return;
    }

    if (!parentMobile.trim()) {
      setError("Please enter parent's contact number.");
      return;
    }

    const cleanedParentMobile = parentMobile.replace(/\D/g, "");

    if (cleanedParentMobile.length !== 10) {
      setError("Please enter a valid 10-digit parent contact number.");
      return;
    }

    try {
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
            child: {
              name: childName.trim(),
              className: childClass.trim(),
              gender: childGender.trim(),
              parentMobile: cleanedParentMobile,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to add child."
        );
      }

      setRegistration(data.registration);

      setChildName("");
      setChildClass("");
      setChildGender("");
      setParentMobile("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to add child."
      );
    }
  }

  /*
   * EDIT COORDINATOR
   */
  function startEditCoordinator(
    index: number,
    coordinator: Coordinator
  ) {
    setError("");
    setEditingType("coordinator");
    setEditingIndex(index);
    setEditName(coordinator.name || "");
    setEditMobile(coordinator.mobile || "");
    setEditEmail(coordinator.email || "");
    setEditClass("");
    setEditGender("");
    setEditParentMobile("");
  }

  /*
   * EDIT CHILD
   */
  function startEditChild(
    index: number,
    child: Child
  ) {
    setError("");
    setEditingType("child");
    setEditingIndex(index);
    setEditName(child.name || "");
    setEditMobile("");
    setEditEmail("");
    setEditClass(child.className || "");
    setEditGender(child.gender || "");
    setEditParentMobile(child.parentMobile || "");
  }

  function cancelEdit() {
    setEditingType(null);
    setEditingIndex(null);
    setEditName("");
    setEditMobile("");
    setEditEmail("");
    setEditClass("");
    setEditGender("");
    setEditParentMobile("");
  }

  async function saveEdit() {
    if (
      editingType === null ||
      editingIndex === null
    ) {
      return;
    }

    setError("");

    if (!editName.trim()) {
      setError("Please enter the name.");
      return;
    }

    if (
      editingType === "coordinator" &&
      !editMobile.trim()
    ) {
      setError("Please enter coordinator mobile number.");
      return;
    }

    if (
      editingType === "child" &&
      !editClass.trim()
    ) {
      setError("Please select child's class.");
      return;
    }

    if (
      editingType === "child" &&
      !editGender.trim()
    ) {
      setError("Please select child gender.");
      return;
    }

    const cleanedParentMobile =
      editParentMobile.replace(/\D/g, "");

    if (
      editingType === "child" &&
      cleanedParentMobile.length !== 10
    ) {
      setError(
        "Please enter a valid 10-digit parent contact number."
      );
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        "/api/registrations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parish,
            type: editingType,
            index: editingIndex,
            data:
              editingType === "coordinator"
                ? {
                    name: editName.trim(),
                    mobile: editMobile.trim(),
                    email: editEmail.trim(),
                  }
                : {
                    name: editName.trim(),
                    className: editClass.trim(),
                    gender: editGender.trim(),
                    parentMobile: cleanedParentMobile,
                  },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to update."
        );
      }

      setRegistration(data.registration);
      cancelEdit();
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /*
   * DELETE COORDINATOR
   */
  async function deleteCoordinator(
    index: number
  ) {
    setError("");

    try {
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
            index,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete coordinator."
        );
      }

      setRegistration(data.registration);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete coordinator."
      );
    }
  }

  /*
   * DELETE CHILD
   */
  async function deleteChild(index: number) {
    setError("");

    try {
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
            index,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete child."
        );
      }

      setRegistration(data.registration);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete child."
      );
    }
  }

  /*
   * REVIEW & SUBMIT
   *
   * This button is intentionally available
   * regardless of whether coordinators/children
   * have been added.
   *
   * Final validation happens on the server.
   */
  function goToReview() {
    setError("");

    router.push(
      `/review?parish=${encodeURIComponent(
        parish
      )}`
    );
  }

  /*
   * LOGOUT
   */
  async function logout() {
    try {
      await fetch(
        "/api/parish-auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(error);
    }

    router.replace("/register");
  }

  /*
   * AUTH CHECK SCREEN
   */
  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            Verifying parish access...
          </p>
        </div>
      </main>
    );
  }

  /*
   * NO AUTHENTICATED PARISH
   */
  if (!parish) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-blue-600 uppercase">
              NINAD 2026
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Parish Registration
            </h1>

            <p className="mt-2 text-gray-500">
              {parish}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4">
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading registration...
            </p>
          </div>
        ) : (
          <>
            {/* COORDINATORS */}
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Coordinators
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add the coordinators responsible for
                  your parish.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Coordinator name"
                  value={coordinatorName}
                  onChange={(e) =>
                    setCoordinatorName(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="Mobile number"
                  value={coordinatorMobile}
                  onChange={(e) =>
                    setCoordinatorMobile(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={coordinatorEmail}
                  onChange={(e) =>
                    setCoordinatorEmail(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={addCoordinator}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Add Coordinator
              </button>

              {/* COORDINATOR LIST */}
              {registration &&
                registration.coordinators &&
                registration.coordinators.length >
                  0 && (
                  <div className="mt-6 space-y-3">
                    {registration.coordinators.map(
                      (
                        coordinator,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {
                                coordinator.name
                              }
                            </p>

                            <p className="text-sm text-gray-500">
                              {
                                coordinator.mobile
                              }
                            </p>

                            {coordinator.email && (
                              <p className="text-sm text-gray-500">
                                {
                                  coordinator.email
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditCoordinator(
                                  index,
                                  coordinator
                                )
                              }
                              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteCoordinator(
                                  index
                                )
                              }
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
            </section>

            {/* CHILDREN */}
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Children
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add the children participating from
                  your parish.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Child name"
                  value={childName}
                  onChange={(e) =>
                    setChildName(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <select
                  value={childClass}
                  onChange={(e) =>
                    setChildClass(e.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                <select
                  value={childGender}
                  onChange={(e) =>
                    setChildGender(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>
                </select>

                <input
                  type="tel"
                  placeholder="Parent's contact number"
                  value={parentMobile}
                  onChange={(e) =>
                    setParentMobile(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  inputMode="numeric"
                  maxLength={10}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={addChild}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Add Child
              </button>

              {/* CHILD LIST */}
              {registration &&
                registration.children &&
                registration.children.length >
                  0 && (
                  <div className="mt-6 space-y-3">
                    {registration.children.map(
                      (child, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {child.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              Class: {child.className}{" "}
                              •{" "}
                              {child.gender}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Parent: {child.parentMobile}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditChild(
                                  index,
                                  child
                                )
                              }
                              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteChild(
                                  index
                                )
                              }
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
            </section>

            {/* EDIT MODAL */}
            {editingType !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit{" "}
                    {editingType === "coordinator"
                      ? "Coordinator"
                      : "Child"}
                  </h2>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder={
                        editingType === "coordinator"
                          ? "Coordinator name"
                          : "Child name"
                      }
                      value={editName}
                      onChange={(e) =>
                        setEditName(e.target.value)
                      }
                      className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {editingType === "coordinator" ? (
                      <>
                        <input
                          type="tel"
                          placeholder="Mobile number"
                          value={editMobile}
                          onChange={(e) =>
                            setEditMobile(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          inputMode="numeric"
                          maxLength={10}
                          className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={editEmail}
                          onChange={(e) =>
                            setEditEmail(e.target.value)
                          }
                          className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:col-span-2"
                        />
                      </>
                    ) : (
                      <>
                        <select
                          value={editClass}
                          onChange={(e) =>
                            setEditClass(e.target.value)
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                        <select
                          value={editGender}
                          onChange={(e) =>
                            setEditGender(e.target.value)
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            Select gender
                          </option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>

                        <input
                          type="tel"
                          placeholder="Parent's contact number"
                          value={editParentMobile}
                          onChange={(e) =>
                            setEditParentMobile(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          inputMode="numeric"
                          maxLength={10}
                          className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:col-span-2"
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Parish
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {parish}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Coordinators
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {registration
                      ?.coordinators
                      ?.length || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Children
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {registration
                      ?.children
                      ?.length || 0}
                  </p>
                </div>
              </div>
            </section>

            {/* REVIEW & SUBMIT */}
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Ready to continue?
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review your registration before
                    final submission.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goToReview}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Review &amp; Submit
                </button>
              </div>
            </section>
          </>
        )}
      </div>
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