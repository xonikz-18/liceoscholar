import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';

import { AccountService } from '../services/account.service';
import { describeHttpError, resolveFileUrl } from '../services/api.config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile-photo-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-photo-editor.component.html',
  styleUrl: './profile-photo-editor.component.scss'
})
export class ProfilePhotoEditorComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly account = inject(AccountService);

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

  /**
   * Local cache keys that older builds used to store a cropped photo in the
   * browser. They are deleted on load so a picture from a previous session can
   * never reappear: the account record is the only source of truth.
   */
  private purgeLegacyCaches(): void {
    const user = this.auth.user();
    const identity = user?.id || user?.email || 'anonymous';

    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(`${this.storageKey}:${identity}`);
    } catch {
      /* Storage may be unavailable (private mode). */
    }
  }

  ngOnInit(): void {
    this.purgeLegacyCaches();

    // Only the photo stored on the account is used. When there isn't one the
    // template falls back to the generic default avatar.
    this.photoUrl = resolveFileUrl(this.auth.user()?.profilePhotoUrl);
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
    if (!this.sourceImage) {
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
      // Show it straight away, then replace with the stored copy once uploaded.
      this.photoUrl = croppedImage;
      this.editorOpen = false;
      this.errorMessage = '';
      void this.persistPhoto(croppedImage);
    } catch (error) {
      console.error('Unable to save the cropped profile photo.', error);
      this.errorMessage = 'Unable to save the photo. Please choose a smaller image or try again.';
    }
  }

  /** Uploads the cropped picture so it is stored against the account. */
  private async persistPhoto(dataUrl: string): Promise<void> {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'profile-photo.jpg', { type: blob.type || 'image/jpeg' });
      const user = await this.account.uploadProfilePhoto(file);
      this.auth.updateUser(user);

      const remotePhoto = resolveFileUrl(user.profilePhotoUrl);
      if (remotePhoto) {
        this.photoUrl = remotePhoto;
      }
      this.changeDetector.markForCheck();
    } catch (error) {
      console.error('Unable to upload the profile photo.', error);
      this.errorMessage = describeHttpError(error);
      // The picture was never stored, so fall back to what the account has.
      this.photoUrl = resolveFileUrl(this.auth.user()?.profilePhotoUrl);
      this.changeDetector.markForCheck();
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
