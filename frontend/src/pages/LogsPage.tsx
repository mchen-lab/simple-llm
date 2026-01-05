import { useEffect, useState } from "react";
import api from "@/lib/api";
import { RefreshCcw, Trash2, ChevronLeft, ChevronRight, Pin } from "lucide-react";

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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  tag?: string | null;
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
  const [tagSearch, setTagSearch] = useState("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Purge state
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeOption, setPurgeOption] = useState("30d"); 

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pagination.limit };
      if (tagSearch !== "all") params.tag = tagSearch;

      const res = await api.get("/api/logs", { params });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get("/api/logs/tags");
      // Ensure we always set an array, even if API returns unexpected data
      setAvailableTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch tags", err);
    }
  };

  const handlePurge = async () => {
    try {
      const isCount = purgeOption.endsWith("l");
      const val = purgeOption.slice(0, -1);
      const param = isCount ? `count_to_keep=${val}` : `days_to_keep=${val}`;
      
      await api.delete(`/api/logs?${param}`);
      setPurgeOpen(false);
      fetchLogs(1); // Refresh logs
    } catch (err) {
      console.error("Failed to purge logs", err);
    }
  };

  const toggleLock = async (logId: number, currentLocked: boolean) => {
      try {
          await api.patch(`/api/logs/${logId}`, { locked: !currentLocked });
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
    fetchTags();
  }, [tagSearch]); // Refetch when filters change

  useEffect(() => {
    const handleRefresh = () => fetchLogs(1);
    window.addEventListener("refresh-logs", handleRefresh);
    return () => window.removeEventListener("refresh-logs", handleRefresh);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="text-lg font-bold tracking-tight whitespace-nowrap">
          Total Logs: {pagination.total}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tag Search Dropdown */}
          <Select value={tagSearch} onValueChange={setTagSearch}>
            <SelectTrigger className="w-[110px] sm:w-[140px] h-8 text-xs px-2">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Purge Button */}
          <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" title="Purge logs">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purge Old Logs</DialogTitle>
                <DialogDescription>
                    Delete old logs based on your selection. **Pinned** logs will always be preserved.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap">Keep:</span>
                    <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        value={purgeOption} 
                        onChange={(e) => setPurgeOption(e.target.value)}
                    >
                        <option value="30l">Last 30 logs</option>
                        <option value="1d">Last 1 day</option>
                        <option value="2d">Last 2 days</option>
                        <option value="3d">Last 3 days</option>
                        <option value="7d">Last 1 week</option>
                        <option value="30d">Last 1 month</option>
                    </select>
                 </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPurgeOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handlePurge}>Purge Logs</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0" onClick={() => fetchLogs(pagination.page)} disabled={loading} title="Refresh">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                        <span className="shrink-0">{log.duration_ms?.toFixed(0) ?? 'N/A'}ms</span>
                    </div>
                    
                    <div className="shrink-0 ml-1">
                        {log.error ? (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Error</Badge>
                        ) : (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200">Success</Badge>
                        )}
                    </div>
                </div>

                <div className="p-3 pt-2 flex flex-col gap-2">
                  <div 
                    className="text-sm font-medium truncate cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors" 
                    title="Click to view full details"
                    onClick={() => setSelectedLog(log)}
                  >
                    {log.tag && (
                      <Badge variant="outline" className="mr-2 px-1.5 h-5 text-[10px] bg-blue-50/50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        {log.tag}
                      </Badge>
                    )}
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

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
                <span>Log Detail</span>
                <span className="text-xs font-normal text-muted-foreground mr-8">
                    {selectedLog?.timestamp && new Date(selectedLog.timestamp).toLocaleString()}
                </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
                Detailed view of the LLM log entry.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="prompt" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="w-full justify-start h-10 bg-transparent p-0 gap-6">
                    <TabsTrigger value="prompt" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 focus-visible:outline-none focus-visible:ring-0">Prompt</TabsTrigger>
                    <TabsTrigger value="response" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 focus-visible:outline-none focus-visible:ring-0">
                        {selectedLog?.error ? 'Error' : 'Response'}
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 focus-visible:outline-none focus-visible:ring-0">Meta</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden p-6 pt-4">
                <TabsContent value="prompt" className="h-full m-0 focus-visible:outline-none">
                    <div className="h-full overflow-auto bg-muted/30 p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
                        {selectedLog?.prompt}
                    </div>
                </TabsContent>

                <TabsContent value="response" className="h-full m-0 focus-visible:outline-none">
                    <div className={cn(
                        "h-full overflow-auto p-4 rounded-lg border font-mono text-sm whitespace-pre",
                        selectedLog?.error ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-muted/30"
                    )}>
                        {selectedLog?.error ? (
                            <div className="whitespace-pre-wrap">{selectedLog.error}</div>
                        ) : (
                            <div 
                                className="syntax-highlight"
                                dangerouslySetInnerHTML={{ 
                                    __html: syntaxHighlight(typeof selectedLog?.response === 'string' ? selectedLog.response : JSON.stringify(selectedLog?.response, null, 2)) 
                                }} 
                            />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="meta" className="h-full m-0 focus-visible:outline-none">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</span>
                                <p className="font-medium text-sm">{selectedLog?.model}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Execution Time</span>
                                <p className="font-medium text-sm">{selectedLog?.duration_ms?.toFixed(0) ?? 'N/A'}ms</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Token Usage</span>
                                <p className="font-medium text-sm">{selectedLog?.metadata?.usage?.total_tokens ?? 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response Format</span>
                                <p className="font-medium text-sm text-blue-500">{selectedLog?.metadata?.format === 'dict' ? 'get_dict' : 'get_text'}</p>
                            </div>
                        </div>

                        {selectedLog?.metadata?.schema && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JSON Schema</span>
                                <div 
                                    className="bg-muted/30 p-3 rounded-md border text-xs overflow-auto max-h-40 font-mono whitespace-pre syntax-highlight"
                                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(selectedLog.metadata.schema, null, 2)) }}
                                />
                            </div>
                        )}

                        {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > (selectedLog?.metadata?.schema ? 3 : 2) && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raw Metadata</span>
                                <div 
                                    className="bg-muted/30 p-3 rounded-md border text-[10px] overflow-auto max-h-60 font-mono whitespace-pre syntax-highlight"
                                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(selectedLog.metadata, null, 2)) }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
            </div>
          </Tabs>
          
          <div className="p-6 pt-2 border-t flex justify-end">
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const syntaxHighlight = (json: string) => {
    if (!json) return "";
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'text-blue-500'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-purple-500 font-semibold'; // key
            } else {
                cls = 'text-green-600 dark:text-green-400'; // string
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-orange-500'; // boolean
        } else if (/null/.test(match)) {
            cls = 'text-gray-400'; // null
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
