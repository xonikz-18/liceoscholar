import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile-photo-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-photo-editor.component.html',
  styleUrl: './profile-photo-editor.component.scss'
})
export class ProfilePhotoEditorComponent implements OnInit {
  @Input({ required: true }) defaultImage = '';
  @Input({ required: true }) storageKey = '';

  photoUrl = '';
  editorOpen = false;
  cropImageUrl = '';
  errorMessage = '';
  zoom = 1;
  imageWidth = 0;
  imageHeight = 0;
  offsetX = 0;
  offsetY = 0;

  readonly cropSize = 280;
  private sourceImage: HTMLImageElement | null = null;
  private baseScale = 1;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    try {
      const savedPhoto = localStorage.getItem(this.storageKey);
      if (savedPhoto?.startsWith('data:image/')) {
        this.photoUrl = savedPhoto;
      }
    } catch (error) {
      console.error('Unable to load the saved profile photo.', error);
      this.errorMessage = 'The saved profile photo could not be loaded.';
    }
  }

  openEditor(fileInput: HTMLInputElement): void {
    this.errorMessage = '';
    fileInput.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'Choose a JPG, PNG, or WebP image.';
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      this.errorMessage = 'Choose an image smaller than 12 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        this.errorMessage = 'The selected image could not be read.';
        this.changeDetector.markForCheck();
        return;
      }

      this.cropImageUrl = reader.result;
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.editorOpen = true;
      this.changeDetector.markForCheck();
    };
    reader.onerror = () => {
      this.errorMessage = 'The selected image could not be read.';
      this.changeDetector.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onCropImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.sourceImage = image;
    this.baseScale = Math.max(
      this.cropSize / image.naturalWidth,
      this.cropSize / image.naturalHeight
    );
    this.updateImageDimensions();
  }

  onZoomChange(value: string): void {
    this.zoom = Number(value);
    this.updateImageDimensions();
    this.clampOffsets();
  }

  onZoomInput(event: Event): void {
    this.onZoomChange((event.target as HTMLInputElement).value);
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragOffsetX = this.offsetX;
    this.dragOffsetY = this.offsetY;
  }

  drag(event: PointerEvent): void {
    if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
      return;
    }

    this.offsetX = this.dragOffsetX + event.clientX - this.dragStartX;
    this.offsetY = this.dragOffsetY + event.clientY - this.dragStartY;
    this.clampOffsets();
  }

  saveCrop(): void {
    if (!this.sourceImage || !this.storageKey) {
      this.errorMessage = 'Select an image before saving.';
      return;
    }

    const scale = this.baseScale * this.zoom;
    const sourceCropSize = this.cropSize / scale;
    const sourceX = (this.imageWidth / 2 - this.cropSize / 2 - this.offsetX) / scale;
    const sourceY = (this.imageHeight / 2 - this.cropSize / 2 - this.offsetY) / scale;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    try {
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('A 2D canvas context is unavailable.');
      }

      context.drawImage(
        this.sourceImage,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        sourceCropSize,
        sourceCropSize,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedImage = canvas.toDataURL('image/jpeg', 0.88);
      localStorage.setItem(this.storageKey, croppedImage);
      this.photoUrl = croppedImage;
      this.editorOpen = false;
      this.errorMessage = '';
    } catch (error) {
      console.error('Unable to save the cropped profile photo.', error);
      this.errorMessage = 'Unable to save the photo. Please choose a smaller image or try again.';
    }
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.cropImageUrl = '';
    this.sourceImage = null;
  }

  private updateImageDimensions(): void {
    if (!this.sourceImage) {
      return;
    }

    this.imageWidth = this.sourceImage.naturalWidth * this.baseScale * this.zoom;
    this.imageHeight = this.sourceImage.naturalHeight * this.baseScale * this.zoom;
  }

  private clampOffsets(): void {
    const maxX = Math.max(0, (this.imageWidth - this.cropSize) / 2);
    const maxY = Math.max(0, (this.imageHeight - this.cropSize) / 2);
    this.offsetX = Math.max(-maxX, Math.min(maxX, this.offsetX));
    this.offsetY = Math.max(-maxY, Math.min(maxY, this.offsetY));
  }
}
