type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-amber-100 text-amber-800",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-200 text-slate-700",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style =
    statusStyles[status] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700",
    };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
};
