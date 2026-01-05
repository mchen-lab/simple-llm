import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Calendar as CalendarIcon, RefreshCcw, Trash2, ChevronLeft, ChevronRight, Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  timestamp: string;
  model: string;
  prompt: string;
  response: any;
  duration_ms: number;
  error?: string;
  metadata?: any;
  locked: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, pages: 1 });
  
  // Filter state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // Purge state
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pagination.limit };
      if (dateRange.from) params.start_date = dateRange.from.toISOString();
      if (dateRange.to) params.end_date = dateRange.to.toISOString();

      const res = await axios.get("/api/logs", { params });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    try {
      await axios.delete(`/api/logs?days_to_keep=${purgeDays}`);
      setPurgeOpen(false);
      fetchLogs(1); // Refresh logs
    } catch (err) {
      console.error("Failed to purge logs", err);
    }
  };

  const toggleLock = async (logId: number, currentLocked: boolean) => {
      try {
          await axios.patch(`/api/logs/${logId}`, { locked: !currentLocked });
          // Update local state optimistic logic
          setLogs(prev => prev.map(log => 
              log.id === logId ? { ...log, locked: !currentLocked } : log
          ));
      } catch (err) {
          console.error("Failed to toggle lock", err);
      }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [dateRange]); // Refetch when filters change

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
          <p className="text-muted-foreground text-sm">
            Total logs: {pagination.total}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange as any}
                onSelect={(range: any) => setDateRange(range || {})}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Purge Button */}
          <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Purge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purge Old Logs</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                 <p className="text-sm text-muted-foreground">
                    Delete logs older than a specific number of days. Locked logs will NOT be deleted.
                 </p>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap">Keep last:</span>
                    <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        value={purgeDays} 
                        onChange={(e) => setPurgeDays(Number(e.target.value))}
                    >
                        <option value={1}>1 Day</option>
                        <option value={7}>7 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                    </select>
                 </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPurgeOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handlePurge}>Purge Logs</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.page)} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            No logs found.
          </div>
        ) : (
          logs.map((log) => {
             const formatType = log.metadata?.format === 'dict' ? 'get_dict' : 'get_text';
             const tokens = log.metadata?.usage?.total_tokens;
             const promptLine = log.prompt.split('\n')[0];
 
             return (
              <Card key={log.id} className="overflow-hidden border shadow-sm">
                <div className="bg-muted/40 border-b p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground w-full">
                    <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                        <span className="font-mono truncate">{new Date(log.timestamp).toLocaleString('sv')}</span>
                        <span className="shrink-0">•</span>
                        <span className="text-blue-500 font-medium shrink-0">{formatType}</span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0">{log.duration_ms.toFixed(0)}ms</span>
                    </div>
                    
                    <div className="shrink-0 ml-1">
                        {log.error ? (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Error</Badge>
                        ) : (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200">Success</Badge>
                        )}
                    </div>
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <div className="text-sm font-medium truncate" title={log.prompt}>
                    {promptLine}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5 text-[11px]">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => toggleLock(log.id, log.locked)}
                            className={cn(
                                "transition-all focus:outline-none",
                                log.locked 
                                    ? "text-muted-foreground" 
                                    : "text-muted-foreground/20 hover:text-muted-foreground"
                            )}
                            title={log.locked ? "Unpin log" : "Pin log (prevent purge)"}
                        >
                            <Pin className={cn("h-3.5 w-3.5", log.locked && "fill-current")} />
                        </button>

                        <span className="font-mono shrink-0 text-muted-foreground/70">
                            {tokens !== undefined ? `${tokens} toks` : ''}
                        </span>
                    </div>
                   
                    <span className="truncate max-w-[60%] text-right font-medium">{log.model}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLogs(pagination.page - 1)} 
            disabled={pagination.page <= 1 || loading}
        >
            <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
        </span>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLogs(pagination.page + 1)} 
            disabled={pagination.page >= pagination.pages || loading}
        >
            <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
