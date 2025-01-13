// src/app/drag-drop.directive.ts
import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appDragDrop]'
})
export class DragDropDirective {
  @Output() fileDropped = new EventEmitter<any>();
  @HostBinding('class.fileover') fileOver: boolean = false;

  // เมื่อลากไฟล์เข้ามาในพื้นที่
  @HostListener('dragover', ['$event']) onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
  }

  // เมื่อลากไฟล์ออกจากพื้นที่
  @HostListener('dragleave', ['$event']) onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  // เมื่อปล่อยไฟล์
  @HostListener('drop', ['$event']) onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    const files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}