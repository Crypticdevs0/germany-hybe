"use client"

import type React from "react"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, X, Upload } from "lucide-react"

interface DocumentUploadSectionProps {
  formData: any
  errors: any
  onDocumentsChange: (files: File[]) => void
}

export default function DocumentUploadSection({ formData, errors, onDocumentsChange }: DocumentUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"]
      const validSize = file.size <= 5 * 1024 * 1024 // 5MB
      return validTypes.includes(file.type) && validSize
    })

    onDocumentsChange([...formData.documents, ...validFiles])
  }

  const removeDocument = (index: number) => {
    const newDocuments = formData.documents.filter((_: File, i: number) => i !== index)
    onDocumentsChange(newDocuments)
  }

  return (
    <div className="space-y-4">
      <Alert className="border-muted-foreground/20">
        <FileText className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Bitte laden Sie folgende Dokumente hoch: Personalausweis oder Reisepass (Vorder- und Rückseite),
          Adressnachweis (nicht älter als 3 Monate).
        </AlertDescription>
      </Alert>

      <div>
        <Label>Dokumente hochladen *</Label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? "border-primary bg-primary/5 scale-[1.02]"
              : errors.documents
                ? "border-destructive"
                : "border-input"
          }`}
        >
          <input
            id="documents"
            type="file"
            multiple
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          <label htmlFor="documents" className="cursor-pointer">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium text-foreground mb-1">Dateien hier ablegen oder klicken zum Durchsuchen</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG bis zu 5MB pro Datei</p>
            </div>
          </label>
        </div>
        {errors.documents && <p className="text-xs text-destructive mt-1">{errors.documents}</p>}
      </div>

      {formData.documents.length > 0 && (
        <div>
          <Label>Hochgeladene Dokumente ({formData.documents.length})</Label>
          <div className="space-y-2 mt-2">
            {formData.documents.map((file: File, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="text-destructive hover:text-destructive/80 transition-colors p-1 hover:bg-destructive/10 rounded"
                  aria-label="Dokument entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
