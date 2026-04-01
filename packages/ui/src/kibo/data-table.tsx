"use client";

import type {
  Cell,
  Column,
  ColumnDef,
  Header,
  HeaderGroup,
  Row,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
} from "@tabler/icons-react";
import type { HTMLAttributes, ReactNode } from "react";
import { useCallback } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody as TableBodyPrimitive,
  TableCell as TableCellPrimitive,
  TableHeader as TableHeaderPrimitive,
  TableHead as TableHeadPrimitive,
  TableRow as TableRowPrimitive,
} from "../ui/table";
import { cn } from "../utils/cn";

export type { ColumnDef } from "@tanstack/react-table";

export type DataTableRenderContext<TData> = {
  headerGroups: HeaderGroup<TData>[];
  rows: Row<TData>[];
  columnCount: number;
};

export type DataTableProviderProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: (ctx: DataTableRenderContext<TData>) => ReactNode;
  className?: string;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
};

export function DataTableProvider<TData, TValue>({
  columns,
  data,
  children,
  className,
  sorting = [],
  onSortingChange,
}: DataTableProviderProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    state: { sorting },
  });

  return (
    <Table className={className}>
      {children({
        headerGroups: table.getHeaderGroups(),
        rows: table.getRowModel().rows,
        columnCount: columns.length,
      })}
    </Table>
  );
}

export type DataTableHeadProps<TData> = {
  header: Header<TData, unknown>;
  className?: string;
};

export function DataTableHead<TData>({
  header,
  className,
}: DataTableHeadProps<TData>) {
  return (
    <TableHeadPrimitive className={className} key={header.id}>
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHeadPrimitive>
  );
}

export type DataTableHeaderGroupProps<TData> = {
  headerGroup: HeaderGroup<TData>;
  children: (props: { header: Header<TData, unknown> }) => ReactNode;
};

export function DataTableHeaderGroup<TData>({
  headerGroup,
  children,
}: DataTableHeaderGroupProps<TData>) {
  return (
    <TableRowPrimitive key={headerGroup.id}>
      {headerGroup.headers.map((header) => children({ header }))}
    </TableRowPrimitive>
  );
}

export type DataTableHeaderProps<TData> = {
  headerGroups: HeaderGroup<TData>[];
  className?: string;
  children: (props: { headerGroup: HeaderGroup<TData> }) => ReactNode;
};

export function DataTableHeader<TData>({
  headerGroups,
  className,
  children,
}: DataTableHeaderProps<TData>) {
  return (
    <TableHeaderPrimitive className={className}>
      {headerGroups.map((headerGroup) => children({ headerGroup }))}
    </TableHeaderPrimitive>
  );
}

export interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const handleSortAsc = useCallback(() => {
    column.toggleSorting(false);
  }, [column]);

  const handleSortDesc = useCallback(() => {
    column.toggleSorting(true);
  }, [column]);

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            size="sm"
            variant="ghost"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <IconArrowDown size={14} className="ml-1" />
            ) : column.getIsSorted() === "asc" ? (
              <IconArrowUp size={14} className="ml-1" />
            ) : (
              <IconArrowsSort size={14} className="ml-1" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleSortAsc}>
            <IconArrowUp size={14} className="mr-2 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc}>
            <IconArrowDown
              size={14}
              className="mr-2 text-muted-foreground/70"
            />
            Desc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type DataTableCellProps<TData> = {
  cell: Cell<TData, unknown>;
  className?: string;
};

export function DataTableCell<TData>({
  cell,
  className,
}: DataTableCellProps<TData>) {
  return (
    <TableCellPrimitive className={className}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCellPrimitive>
  );
}

export type DataTableRowProps<TData> = {
  row: Row<TData>;
  children: (props: { cell: Cell<TData, unknown> }) => ReactNode;
  className?: string;
  onClick?: () => void;
};

export function DataTableRow<TData>({
  row,
  children,
  className,
  onClick,
}: DataTableRowProps<TData>) {
  return (
    <TableRowPrimitive
      className={cn(onClick && "cursor-pointer", className)}
      data-state={row.getIsSelected() && "selected"}
      key={row.id}
      onClick={onClick}
    >
      {row.getVisibleCells().map((cell) => children({ cell }))}
    </TableRowPrimitive>
  );
}

export type DataTableBodyProps<TData> = {
  rows: Row<TData>[];
  columnCount: number;
  children: (props: { row: Row<TData> }) => ReactNode;
  className?: string;
  emptyMessage?: string;
};

export function DataTableBody<TData>({
  rows,
  columnCount,
  children,
  className,
  emptyMessage = "No results.",
}: DataTableBodyProps<TData>) {
  return (
    <TableBodyPrimitive className={className}>
      {rows.length > 0 ? (
        rows.map((row) => children({ row }))
      ) : (
        <TableRowPrimitive>
          <TableCellPrimitive
            className="h-24 text-center text-muted-foreground"
            colSpan={columnCount}
          >
            {emptyMessage}
          </TableCellPrimitive>
        </TableRowPrimitive>
      )}
    </TableBodyPrimitive>
  );
}
