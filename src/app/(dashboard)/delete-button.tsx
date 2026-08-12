"use client";

export function DeleteButton({
  action,
  id,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      className="ml-2 inline"
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-red-400 hover:text-red-600">
        削除
      </button>
    </form>
  );
}
