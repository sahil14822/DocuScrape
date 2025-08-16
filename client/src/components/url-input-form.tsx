import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScrapeJob, InsertScrapeJob } from "@shared/schema";

interface UrlInputFormProps {
  onJobCreated: (job: ScrapeJob) => void;
}

export default function UrlInputForm({ onJobCreated }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const { toast } = useToast();

  const scrapeMutation = useMutation({
    mutationFn: async (data: InsertScrapeJob) => {
      const response = await apiRequest("POST", "/api/scrape", data);
      return response.json();
    },
    onSuccess: (job: ScrapeJob) => {
      onJobCreated(job);
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to scrape.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL.",
        variant: "destructive",
      });
      return;
    }

    scrapeMutation.mutate({ url, format });
  };

  const handleClear = () => {
    setUrl("");
    setFormat("pdf");
  };

  const isValidUrl = () => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input Field */}
        <div className="space-y-2">
          <Label htmlFor="url" className="block text-sm font-medium text-gray-700">
            Website URL
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link className="text-gray-400 h-4 w-4" />
            </div>
            <Input
              type="url"
              id="url"
              name="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`pl-10 font-mono ${!isValidUrl() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              required
              data-testid="input-url"
            />
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <i className="fas fa-info-circle mr-1"></i>
            We'll extract the main content while removing ads and navigation
          </p>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label className="block text-sm font-medium text-gray-700">
            Output Format
          </Label>
          <RadioGroup value={format} onValueChange={(value: "pdf" | "docx") => setFormat(value)}>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" data-testid="radio-pdf" />
                <Label htmlFor="pdf" className="text-sm text-gray-700">PDF Document</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" data-testid="radio-docx" />
                <Label htmlFor="docx" className="text-sm text-gray-700">Word Document</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            disabled={scrapeMutation.isPending || !isValidUrl()}
            data-testid="button-scrape"
          >
            <i className="fas fa-download mr-2"></i>
            {scrapeMutation.isPending ? "Processing..." : "Scrape & Generate Document"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleClear}
            className="px-6 py-3"
            data-testid="button-clear"
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
