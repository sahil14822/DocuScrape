import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import type { ScrapeJob } from "@shared/schema";

interface LoadingStateProps {
  job: ScrapeJob;
  onJobCompleted: (job: ScrapeJob) => void;
  onNewScrape: () => void;
}

export default function LoadingState({ job, onJobCompleted, onNewScrape }: LoadingStateProps) {
  const { data: currentJob, isError } = useQuery<ScrapeJob>({
    queryKey: ["/api/scrape", job.id],
    refetchInterval: (data) => {
      // Stop polling if job is completed or failed
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  const actualJob = currentJob || job;

  useEffect(() => {
    if (actualJob.status === "completed") {
      onJobCompleted(actualJob);
    }
  }, [actualJob.status, actualJob, onJobCompleted]);

  if (isError || actualJob.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Scraping Failed</h3>
          <p className="text-red-700 mb-4">
            {actualJob.error || "Unable to scrape the website. Please check the URL and try again."}
          </p>
          <Button onClick={onNewScrape} variant="outline" data-testid="button-try-again">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getStepStatus = (step: number) => {
    const progress = actualJob.progress || 0;
    if (step === 1) return progress >= 10 ? "completed" : "pending";
    if (step === 2) return progress >= 60 ? "completed" : progress >= 30 ? "active" : "pending";
    if (step === 3) return progress >= 100 ? "completed" : progress >= 80 ? "active" : "pending";
    return "pending";
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="text-lg font-medium text-primary-700">Processing your request...</span>
      </div>
      
      {/* Progress Steps */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            getStepStatus(1) === "completed" ? "bg-primary-600" : "bg-gray-300"
          }`}>
            {getStepStatus(1) === "completed" ? (
              <Check className="text-white h-3 w-3" />
            ) : (
              <span className="text-xs text-gray-500">1</span>
            )}
          </div>
          <span className="text-sm text-gray-700">URL validated successfully</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            getStepStatus(2) === "completed" ? "bg-primary-600" : 
            getStepStatus(2) === "active" ? "bg-primary-600" : "bg-gray-300"
          }`}>
            {getStepStatus(2) === "completed" ? (
              <Check className="text-white h-3 w-3" />
            ) : getStepStatus(2) === "active" ? (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            ) : (
              <span className="text-xs text-gray-500">2</span>
            )}
          </div>
          <span className="text-sm text-gray-700">Scraping website content...</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            getStepStatus(3) === "completed" ? "bg-primary-600" : 
            getStepStatus(3) === "active" ? "bg-primary-600" : "bg-gray-300"
          }`}>
            {getStepStatus(3) === "completed" ? (
              <Check className="text-white h-3 w-3" />
            ) : getStepStatus(3) === "active" ? (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            ) : (
              <span className="text-xs text-gray-500">3</span>
            )}
          </div>
          <span className="text-sm text-gray-700">Generating PDF document...</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span data-testid="text-progress">{actualJob.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${actualJob.progress || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
