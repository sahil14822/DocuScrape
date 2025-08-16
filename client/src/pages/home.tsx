import { useState } from "react";
import { Worm, Shield } from "lucide-react";
import UrlInputForm from "@/components/url-input-form";
import LoadingState from "@/components/loading-state";
import SuccessState from "@/components/success-state";
import RecentDocuments from "@/components/recent-documents";
import type { ScrapeJob } from "@shared/schema";

export default function Home() {
  const [currentJob, setCurrentJob] = useState<ScrapeJob | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleJobCreated = (job: ScrapeJob) => {
    setCurrentJob(job);
    setShowSuccess(false);
  };

  const handleJobCompleted = (job: ScrapeJob) => {
    setCurrentJob(job);
    setShowSuccess(true);
  };

  const handleNewScrape = () => {
    setCurrentJob(null);
    setShowSuccess(false);
  };

  return (
    <div className="bg-gray-50 font-inter antialiased min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Worm className="text-white text-lg h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Web Scraper</h1>
                <p className="text-sm text-gray-500">Document Generator</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-sm text-gray-500 flex items-center">
                <Shield className="mr-1 h-4 w-4" />
                Secure & Fast
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Scraping Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Extract Content from Any Website</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enter a website URL below to scrape its content and download it as a professionally formatted PDF document.
            </p>
          </div>

          {!currentJob && (
            <UrlInputForm onJobCreated={handleJobCreated} />
          )}

          {currentJob && !showSuccess && (
            <LoadingState 
              job={currentJob} 
              onJobCompleted={handleJobCompleted}
              onNewScrape={handleNewScrape}
            />
          )}

          {showSuccess && currentJob && (
            <SuccessState 
              job={currentJob} 
              onNewScrape={handleNewScrape} 
            />
          )}
        </div>

        {/* Recent Documents */}
        <RecentDocuments />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <i className="fas fa-check text-success-600 mr-2"></i>
                  Smart content extraction
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-success-600 mr-2"></i>
                  Multiple output formats
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-success-600 mr-2"></i>
                  Professional formatting
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Security</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <i className="fas fa-shield-alt text-primary-600 mr-2"></i>
                  Secure processing
                </li>
                <li className="flex items-center">
                  <i className="fas fa-trash text-primary-600 mr-2"></i>
                  Auto file cleanup
                </li>
                <li className="flex items-center">
                  <i className="fas fa-lock text-primary-600 mr-2"></i>
                  No data storage
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <i className="fas fa-question-circle mr-2"></i>
                  Help & Documentation
                </li>
                <li>
                  <i className="fas fa-envelope mr-2"></i>
                  Contact Support
                </li>
                <li>
                  <i className="fas fa-bug mr-2"></i>
                  Report Issues
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2024 Web Scraper & Document Generator. Built with modern web technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
