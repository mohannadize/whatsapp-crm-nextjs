"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileContext } from "@/context/profile-context";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProfile } = useProfileContext();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 10; // Number of items per page

  const { data: actionsData, refetch: refetchActions, isLoading: isLoadingActions } = api.actions.getActions.useQuery({
    page,
    limit,
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
  });

  const { data: actionsSummary, refetch: refetchSummary } = api.actions.getActionsSummary.useQuery({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
  });

  const actions = actionsData?.actions ?? [];
  const totalPages = actionsData?.totalPages ?? 1;

  type ActionApiType = NonNullable<typeof actions>[number];

  const [selectedAction, setSelectedAction] = useState<ActionApiType | null>(
    null,
  );

  useEffect(() => {
    void refetchActions();
    void refetchSummary();
  }, [dateRange, refetchActions, refetchSummary]);

  if (!selectedProfile) {
    return <div>No profile selected</div>;
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/actions?page=${newPage}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actions</h1>
        <DatePickerWithRange
          initialDateRange={{ from: dateRange.from, to: dateRange.to }}
          onDateRangeChange={(newRange) => {
            if (newRange?.from && newRange?.to) {
              setDateRange({ from: newRange.from, to: newRange.to });
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionsSummary ? (
                actionsSummary.totalActions
              ) : (
                <Skeleton className="h-6 w-16" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {actionsSummary ? (
                actionsSummary.totalSuccess
              ) : (
                <Skeleton className="h-6 w-16" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionsSummary ? (
                actionsSummary.totalPending
              ) : (
                <Skeleton className="h-6 w-16" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {actionsSummary ? (
                actionsSummary.totalFailed
              ) : (
                <Skeleton className="h-6 w-16" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions?.map((action) => (
              <TableRow
                key={action.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedAction(action)}
              >
                <TableCell>{action.type}</TableCell>
                <TableCell>
                  <span
                    className={`font-medium ${
                      action.status === "PENDING"
                        ? "text-yellow-600"
                        : action.status === "SUCCESS"
                          ? "text-green-600"
                          : action.status === "FAILED"
                            ? "text-red-600"
                            : ""
                    }`}
                  >
                    {action.status}
                  </span>
                </TableCell>
                <TableCell>{action.contact.name}</TableCell>
                <TableCell>{action.template?.name ?? "N/A"}</TableCell>
                <TableCell>{action.profile.name}</TableCell>
                <TableCell>{action.createdAt.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No actions found
                </TableCell>
              </TableRow>
            )}
            {isLoadingActions && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>

      <Dialog
        open={!!selectedAction}
        onOpenChange={() => setSelectedAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Activity Log</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {selectedAction?.activityLog.map((log, index) => (
              <div key={index} className="mb-2">
                {log.status}: {log.message}
                <br />
                <small className="text-xs text-muted-foreground">
                  {log.timestamp}
                </small>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
