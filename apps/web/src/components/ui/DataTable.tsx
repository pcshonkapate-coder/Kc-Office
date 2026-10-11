'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T)[];
  isLoading?: boolean;
  bulkActions?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'danger' | 'default';
    onClick: (selectedItems: T[]) => void;
  }[];
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchableKeys,
  isLoading = false,
  bulkActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Search / Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchableKeys && searchableKeys.length > 0) {
        return searchableKeys.some((key) => {
          const val = item[key];
          return val != null && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(item).some(
        (val) => val != null && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchableKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comp = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allKeys = new Set(paginatedData.map(keyExtractor));
      setSelectedKeys(allKeys);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectRow = (key: string) => {
    const updated = new Set(selectedKeys);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setSelectedKeys(updated);
  };

  const toggleColumn = (key: string) => {
    const updated = new Set(visibleColumns);
    if (updated.has(key)) {
      if (updated.size > 1) updated.delete(key);
    } else {
      updated.add(key);
    }
    setVisibleColumns(updated);
  };

  const activeColumns = columns.filter((c) => visibleColumns.has(c.key));
  const selectedItems = data.filter((item) => selectedKeys.has(keyExtractor(item)));

  return (
    <div className="space-y-3 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 relative">
          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {showColumnToggle && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                <span className="text-[11px] font-semibold uppercase text-slate-400 px-2 py-1 block font-mono">
                  Toggle Columns
                </span>
                <div className="space-y-1 mt-1">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-50 rounded-lg text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedKeys.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 flex items-center justify-between animate-fade-in">
          <span className="text-xs text-blue-900 font-medium">
            {selectedKeys.size} record{selectedKeys.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            {bulkActions?.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedItems)}
                  className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    action.variant === 'danger'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px] font-mono">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((item) => selectedKeys.has(keyExtractor(item)))
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`p-3 select-none ${col.sortable ? 'cursor-pointer hover:text-slate-900' : ''} ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ChevronsUpDown
                        className={`w-3.5 h-3.5 ${
                          sortKey === col.key ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={activeColumns.length + 1} className="p-8 text-center text-slate-500">
                  <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length + 1}
                  className="p-8 text-center text-slate-500 font-medium"
                >
                  No records found matching current query.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const key = keyExtractor(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {activeColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-3 text-slate-700 font-medium ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
          >
            {[5, 10, 25, 50, 100].map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <span className="text-slate-300">|</span>
          <span>
            Total: <strong className="text-slate-900 font-semibold">{sortedData.length}</strong> records
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span>
            Page <strong className="text-slate-900 font-semibold">{page}</strong> of{' '}
            <strong className="text-slate-900 font-semibold">{totalPages}</strong>
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
