import type { ReactNode } from 'react';

type SimpleTableProps = {
  headers: string[];
  rows: ReactNode[][];
  emptyState?: {
    title: string;
    description: string;
  };
};

export function SimpleTable({ headers, rows, emptyState }: SimpleTableProps) {
  return (
    <div className="table-wrap simple-table-card">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="simple-table-empty-row">
              <td colSpan={headers.length}>
                <div className="simple-table-empty-state">
                  <strong>{emptyState?.title ?? 'Nothing to review right now'}</strong>
                  <span>
                    {emptyState?.description ??
                      'This view is clear for the current scope and filter.'}
                  </span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
