"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "~~/app/Uikit/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~~/app/Uikit/components/ui/dropdown-menu";
import { Input } from "~~/app/Uikit/components/ui/input";
import { Skeleton } from "~~/app/Uikit/components/ui/skeleton";
import { SkeletonHeader } from "~~/app/Uikit/components/ui/skeletons";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~~/app/Uikit/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("name")?.setFilterValue(event.target.value);
          }}
          className="max-w-sm"
        />
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Include
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              className="capitalize"
              checked={table.getColumn("status")?.getFilterValue() !== true}
              onCheckedChange={(value) => {
                if (value === false)
                  table.getColumn("status")?.setFilterValue(true);
                else table.getColumn("status")?.setFilterValue(undefined);
              }}
            >
              {"Past bets"}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>

      <div className="rounded-md border">
        <Table>
          {isLoading ? (
            <TableHeader>
              <TableHead className="text-gray-400">
                {" "}
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
              <TableHead className="text-gray-400">
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
              <TableHead className="text-gray-400">
                {" "}
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
              <TableHead className="text-gray-400">
                {" "}
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
              <TableHead className="text-gray-400">
                {" "}
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
              <TableHead className="text-gray-400">
                {" "}
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </TableHead>
            </TableHeader>
          ) : (
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          )}

          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-gray-800 hover:bg-gray-900">
                  <TableCell>
                    <Skeleton className="h-4 w-48 bg-gray-800" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 bg-gray-800" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 bg-gray-800" />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="rounded-lg border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800"
                    >
                      <Skeleton className="h-4 w-12 bg-gray-800" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No positions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div>{`Page ${table.getPageCount() === 0 ? 0 : table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}</div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
