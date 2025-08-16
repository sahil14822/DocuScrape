import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScrapeJob } from "@shared/schema";

export default function RecentDocuments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery<ScrapeJob[]>({
    queryKey: ["/api/documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the document.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (filename: string) => {
    window.open(`/api/download/${filename}`, '_blank');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatDate = (date?: Date | null) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Documents</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-3 rounded-lg">
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
        <Button variant="ghost" className="text-primary-600 hover:text-primary-700" size="sm">
          View All
        </Button>
      </div>

      {!documents || documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-file-alt text-4xl mb-4 text-gray-300"></i>
          <p>No documents yet. Start by scraping your first website!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              data-testid={`document-${doc.id}`}
            >
              <div className="flex-shrink-0">
                {doc.format === "pdf" ? (
                  <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                ) : (
                  <i className="fas fa-file-word text-blue-500 text-xl"></i>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate" data-testid={`text-title-${doc.id}`}>
                  {doc.title || "Untitled Document"}
                </p>
                <p className="text-sm text-gray-500">
                  <span data-testid={`text-hostname-${doc.id}`}>{getHostname(doc.url)}</span> • 
                  <span data-testid={`text-pages-${doc.id}`}> {doc.pages || 0} pages</span> • 
                  <span data-testid={`text-date-${doc.id}`}> {formatDate(doc.createdAt)}</span>
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => doc.filename && handleDownload(doc.filename)}
                  className="text-gray-400 hover:text-primary-600"
                  data-testid={`button-download-${doc.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleteMutation.isPending}
                  className="text-gray-400 hover:text-red-600"
                  data-testid={`button-delete-${doc.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
