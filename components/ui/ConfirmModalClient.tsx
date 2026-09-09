"use client";

type Props = {
  isActive: boolean;
  deactivateAction: () => Promise<void>;
  activateAction: () => Promise<void>;
};

export default function ConfirmModalClient({ isActive, deactivateAction, activateAction }: Props) {
  const message = isActive
    ? "This will deactivate the account and prevent login. Continue?"
    : "This will activate the account and allow login. Continue?";

  return (
    <form
      action={isActive ? deactivateAction : activateAction}
      onSubmit={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={`rounded-md px-3 py-2 text-xs font-medium ${
          isActive
            ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {isActive ? "Deactivate Account" : "Activate Account"}
      </button>
    </form>
  );
}
