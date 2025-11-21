'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useBulkImportDepartments } from '@/hooks/useDepartments';

interface DepartmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepartmentImportDialog({ open, onOpenChange }: DepartmentImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const bulkImportMutation = useBulkImportDepartments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/departments/template', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const result = await bulkImportMutation.mutateAsync(formData);
      setImportResult(result.data);
    } catch (error: any) {
      // Error result is already set by the mutation
      if (error.response?.data?.data) {
        setImportResult(error.response.data.data);
      }
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const getStatusIcon = () => {
    if (!importResult) return null;

    if (importResult.success && importResult.successCount > 0) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (importResult.failureCount > 0) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (!importResult) return 'default';
    if (importResult.success && importResult.successCount > 0) return 'default';
    return 'destructive';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Departments</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import multiple departments at once. Download the template to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template Section */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Step 1: Download Template</h3>
                <p className="text-sm text-muted-foreground">
                  Get the Excel template with sample data and instructions
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Upload File Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Step 2: Upload Filled Template</h3>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={bulkImportMutation.isPending}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || bulkImportMutation.isPending}
              >
                {bulkImportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Import Progress/Result */}
          {bulkImportMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={getStatusColor()}>
              <div className="flex items-start gap-3">
                {getStatusIcon()}
                <div className="flex-1 space-y-2">
                  <AlertTitle className="text-base font-semibold">Import Summary</AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <div className="text-2xl font-bold">{importResult.totalRows}</div>
                        <div className="text-xs text-muted-foreground">Total Rows</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.successCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.failureCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Validation Errors Table */}
          {importResult && importResult.errors && importResult.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-600">Validation Errors</h3>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((error: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell className="font-mono text-sm">{error.code}</TableCell>
                        <TableCell className="font-medium">{error.field}</TableCell>
                        <TableCell className="text-red-600">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                Fix these errors in your Excel file and try importing again.
              </p>
            </div>
          )}

          {/* Success List */}
          {importResult && importResult.successfulDepartments && importResult.successfulDepartments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">Successfully Imported Departments</h3>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.successfulDepartments.map((dept: any) => (
                      <TableRow key={dept._id}>
                        <TableCell className="font-mono text-sm">{dept.code}</TableCell>
                        <TableCell>{dept.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure all required fields (marked with *) are filled</li>
                <li>Department Code and Name must be unique</li>
                <li>Department Code will be automatically converted to uppercase</li>
                <li>Status must be either ACTIVE or INACTIVE</li>
                <li>Do not modify the template header row</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {importResult && importResult.successCount > 0 && (
              <Button onClick={handleClose}>Done</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
