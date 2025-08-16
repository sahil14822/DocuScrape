import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Eye } from "lucide-react";
import type { ScrapeJob } from "@shared/schema";

interface SuccessStateProps {
  job: ScrapeJob;
  onNewScrape: () => void;
}

export default function SuccessState({ job, onNewScrape }: SuccessStateProps) {
  const handleDownload = () => {
    if (job.filename) {
      window.open(`/api/download/${job.filename}`, '_blank');
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slide-up">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-50 mb-4">
          <CheckCircle className="text-success-600 h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Generated Successfully!</h3>
        <p className="text-gray-600 mb-6">
          Your document has been created and is ready for download.
        </p>

        {/* Document Preview Card */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <i className="fas fa-file-pdf text-red-500 text-2xl"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900" data-testid="text-filename">
                {job.filename || "Document.pdf"}
              </p>
              <p className="text-sm text-gray-500">
                <span data-testid="text-pages">{job.pages || 0} pages</span> • 
                <span data-testid="text-filesize"> {formatFileSize(job.fileSize)}</span> • 
                <span data-testid="text-created"> Generated {formatDate(job.completedAt)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleDownload}
            className="bg-success-600 text-white hover:bg-success-700 focus:ring-2 focus:ring-success-500 focus:ring-offset-2"
            data-testid="button-download"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button 
            variant="secondary"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            data-testid="button-preview"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button 
            variant="ghost"
            onClick={onNewScrape}
            className="text-primary-600 hover:bg-primary-50"
            data-testid="button-new-scrape"
          >
            Scrape Another URL
          </Button>
        </div>
      </div>
    </div>
  );
}
