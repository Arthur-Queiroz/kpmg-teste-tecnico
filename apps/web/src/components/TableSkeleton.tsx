import { COMPANY_TABLE_COLUMNS } from "./CompanyTable";

const SKELETON_CELL_COUNT = 6;

export interface TableSkeletonProps {
  rowCount?: number;
}

export function TableSkeleton({ rowCount = 4 }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto py-2" aria-busy="true" aria-label="Carregando empresas">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div
          key={rowIndex}
          style={{ gridTemplateColumns: COMPANY_TABLE_COLUMNS }}
          className="grid animate-pulse items-center gap-6 border-b border-border-subtle p-5"
        >
          {Array.from({ length: SKELETON_CELL_COUNT }, (_, cellIndex) => (
            <div
              key={cellIndex}
              className={`h-3.5 rounded-pill ${
                cellIndex % 2 === 0 ? "bg-accent-surface" : "bg-bg-subtle"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
