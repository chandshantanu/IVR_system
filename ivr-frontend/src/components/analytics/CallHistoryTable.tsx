'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, Filter, Search, RefreshCw, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyticsApi, CallHistoryFilters, CallHistoryItem } from '@/lib/api/analytics';
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer';
import { exotelApi } from '@/lib/api/exotel';
import { toast } from '@/lib/toast';

export function CallHistoryTable() {
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [callingBack, setCallingBack] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallHistoryFilters>({
    limit: 20,
  });

  const loadCallHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getCallHistory({
        ...filters,
        page,
      });
      setCalls(response.calls);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  const handleExportCsv = async () => {
    try {
      const blob = await analyticsApi.exportCallHistoryToCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const handleSyncCalls = async () => {
    try {
      setSyncing(true);
      const result = await exotelApi.syncCalls();

      if (result.success) {
        toast.success(
          `Synced ${result.syncedCount || 0} calls successfully${result.errorCount ? ` (${result.errorCount} errors)` : ''}`,
          'Sync Complete'
        );
        // Reload call history after sync
        await loadCallHistory();
      }
    } catch (error) {
      console.error('Failed to sync calls:', error);
      toast.error('Failed to sync calls from Exotel. Check console for details.', 'Sync Failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleCallBack = async (call: CallHistoryItem) => {
    try {
      setCallingBack(call.callSid);

      // Use the unmasked number for the API call (if available)
      const callerNumber = (call as any).callerNumberUnmasked || call.callerNumber;

      const response = await analyticsApi.callbackCaller({
        callerNumber,
        originalCallId: call.callSid,
      });

      if (response.success) {
        toast.success(
          `Calling back ${call.callerNumber}...`,
          'Call Initiated'
        );
      }
    } catch (error: any) {
      console.error('Failed to initiate callback:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initiate callback. Please try again.';
      toast.error(errorMessage, 'Callback Failed');
    } finally {
      setCallingBack(null);
    }
  };

  const handleSearch = (callerNumber: string) => {
    setFilters((prev) => ({ ...prev, callerNumber }));
    setPage(1);
    loadCallHistory();
  };

  const getStatusBadge = (status: string, category?: string) => {
    const statusColors: Record<string, string> = {
      success: 'bg-success-bg text-success border-success/30',
      in_progress: 'bg-info-bg text-info border-info/30',
      failed: 'bg-destructive-bg text-destructive border-destructive/30',
      abandoned: 'bg-muted text-muted-foreground border-border',
      unknown: 'bg-warning-bg text-warning border-warning/30',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
          statusColors[category || 'unknown'] || 'bg-muted text-muted-foreground border-border'
        }`}
        title={category || 'Status category unknown'}
      >
        {status}
      </span>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Call History</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSyncCalls}
              variant="outline"
              size="sm"
              disabled={syncing}
              title="Manually sync call data from Exotel (useful when webhooks are not working)"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Calls'}
            </Button>
            <Button onClick={handleExportCsv} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by caller number..."
                className="pl-10"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setFilters((prev) => {
                      const { callerNumber, ...rest } = prev;
                      return rest;
                    });
                    loadCallHistory();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e.currentTarget.value);
                  }
                }}
              />
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value: string) => {
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : value,
                }));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed (Answered)</SelectItem>
                <SelectItem value="missed">Missed (Rang, No Answer)</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="ringing">Ringing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call SID</TableHead>
                  <TableHead>Flow</TableHead>
                  <TableHead>Caller Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No calls found
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow key={call.id} className="transition-colors duration-fast ease-medical hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{call.callSid}</TableCell>
                      <TableCell>{call.flow.name}</TableCell>
                      <TableCell>{call.callerNumber}</TableCell>
                      <TableCell>{getStatusBadge(call.status, call.statusCategory)}</TableCell>
                      <TableCell>
                        {format(new Date(call.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                      <TableCell>
                        {call.recordingUrl ? (
                          <RecordingPlayer callSid={call.callSid} compact />
                        ) : (
                          <span className="text-sm text-muted-foreground">No recording</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCallBack(call)}
                          disabled={callingBack === call.callSid}
                          className="h-8 w-8 p-0"
                          title="Call back this number"
                        >
                          {callingBack === call.callSid ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * (filters.limit || 20) + 1} to{' '}
                {Math.min(page * (filters.limit || 20), total)} of {total} calls
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
