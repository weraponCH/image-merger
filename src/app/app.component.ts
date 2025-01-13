import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import jsPDF from 'jspdf';

interface FileModel {
  name: string;
  path: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  imageList: FileModel[] = [];
  errors: string[] = [];
  isProcessing: boolean = false;
  currentProgress: number = 0;
  private readonly allowedTypes = {
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    extensions: ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']
  };

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  drop(event: CdkDragDrop<FileModel[]>): void {
    if (!this.isProcessing) {
      moveItemInArray(this.imageList, event.previousIndex, event.currentIndex);
    }
  }

  onFileSelect(event: any): void {
    if (!this.isProcessing) {
      const files = event.target.files;
      if (files) {
        this.processFiles(files);
      }
    }
  }

  private async processFiles(files: FileList): Promise<void> {
    Array.from(files).forEach(file => {
      if (this.isValidFileType(file)) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageList.push({
            name: file.name,
            path: e.target.result
          });
        };
        reader.readAsDataURL(file);
      } else {
        this.errors.push(`ไฟล์ "${file.name}" ไม่ใช่ไฟล์รูปภาพที่รองรับ`);
      }
    });
  }

  private isValidFileType(file: File): boolean {
    if (this.allowedTypes.mimeTypes.includes(file.type)) {
      return true;
    }

    const fileName = file.name.toLowerCase();
    return this.allowedTypes.extensions.some(ext => 
      fileName.endsWith(ext.toLowerCase())
    );
  }

  openImage(fileModel: FileModel): void {
    if (!this.isProcessing && typeof fileModel.path === 'string' && fileModel.path.startsWith('data:image')) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileModel.name}</title>
            <style>
              body { 
                margin: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                background: #f0f0f0;
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${fileModel.path}" alt="${fileModel.name}">
          </body>
        </html>`;

      const newWindow = window.open('');
      newWindow?.document.write(html);
      newWindow?.document.close();
    }
  }

  removeImage(index: number): void {
    if (!this.isProcessing) {
      this.imageList.splice(index, 1);
    }
  }

  async generatePDF(): Promise<void> {
    if (this.imageList.length === 0 || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.currentProgress = 0;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      for (let i = 0; i < this.imageList.length; i++) {
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        this.currentProgress = (i / this.imageList.length) * 100;

        const img = await this.loadAndNormalizeImage(this.imageList[i].path);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(img);
        const ratio = Math.min(
          pageWidth / imgProps.width,
          pageHeight / imgProps.height
        );
        
        const imgWidth = imgProps.width * ratio;
        const imgHeight = imgProps.height * ratio;
        
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
      }

      this.currentProgress = 100;

      const pdfBlob = pdf.output('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.errors.push('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.isProcessing = false;
      this.currentProgress = 0;
    }
  }

  private async loadAndNormalizeImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        } else {
          reject(new Error('Cannot get canvas context'));
        }
      };

      img.onerror = reject;
      img.src = src;
    });
  }

  onFileDropped(files: FileList): void {
    if (!this.isProcessing) {
      this.processFiles(files);
    }
  }
}