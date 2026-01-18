'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Calendar, Phone, Clock, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer';
import { recordingsApi, type CallWithRecording } from '@/lib/api/recordings';
import { exotelApi } from '@/lib/api/exotel';
import { toast } from 'sonner';

export function RecordingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [calls, setCalls] = useState<CallWithRecording[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [filters, setFilters] = useState({
    phoneNumber: searchParams.get('phoneNumber') || '',
    direction: searchParams.get('direction') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const response = await recordingsApi.getCallsWithRecordings({
        phoneNumber: filters.phoneNumber || undefined,
        direction: filters.direction !== 'all' ? (filters.direction as 'inbound' | 'outbound') : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        limit,
      });

      setCalls(response.calls);
      setTotal(response.total);
    } catch (error: any) {
      toast.error('Failed to load recordings', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change

    // Update URL params
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.push(pathname + '?' + newParams.toString());
  };

  const handleReset = () => {
    setFilters({
      phoneNumber: '',
      direction: 'all',
      startDate: '',
      endDate: '',
    });
    setPage(1);
    router.push(pathname);
  };

  const handleSyncCalls = async () => {
    setSyncing(true);
    try {
      const result = await exotelApi.syncCalls();

      if (result.success) {
        toast.success(
          `Synced ${result.syncedCount || 0} calls successfully${result.errorCount ? ` (${result.errorCount} errors)` : ''}`,
          { description: 'Call data updated from Exotel' }
        );
        // Reload recordings after sync
        await fetchRecordings();
      }
    } catch (error: any) {
      toast.error('Failed to sync calls from Exotel', {
        description: error.message || 'Please try again',
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (durationStr: string) => {
    if (!durationStr) return 'N/A';
    const seconds = parseInt(durationStr, 10);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Recordings</h1>
          <p className="text-muted-foreground">
            Listen to and manage your call recordings
          </p>
        </div>
        <Button
          onClick={handleSyncCalls}
          variant="outline"
          disabled={syncing || loading}
          title="Manually sync call data from Exotel (useful when webhooks are not working)"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Calls'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by phone number..."
              value={filters.phoneNumber}
              onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
            />

            <Select
              value={filters.direction}
              onValueChange={(value) => handleFilterChange('direction', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => fetchRecordings()}>Apply Filters</Button>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {calls.length} of {total} recordings
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : calls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recordings Found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {filters.phoneNumber || filters.direction !== 'all' || filters.startDate || filters.endDate
                  ? 'Try adjusting your filters to see more recordings'
                  : 'No recorded calls available yet. Call recordings from Exotel will appear here once calls are made and recorded. Click "Sync Calls" to fetch the latest data from Exotel.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          calls.map((call) => (
            <Card key={call.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {call.fromNumber} → {call.toNumber}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(call.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        call.direction === 'inbound'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {call.direction}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        call.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {call.status}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RecordingPlayer callSid={call.callSid} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
