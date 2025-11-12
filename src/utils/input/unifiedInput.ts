/**
 * Unified Input Handler
 * Abstracts mouse, touch, and keyboard events for spiral navigation
 */

type InputCallback = {
  onWheel?: (deltaY: number, clientX: number, clientY: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  onZoom?: (scale: number, centerX: number, centerY: number) => void;
  onKeyDown?: (key: string, event: KeyboardEvent) => void;
};

export class UnifiedInputHandler {
  private element: HTMLElement;
  private callbacks: InputCallback;
  private isPanning = false;
  private lastX = 0;
  private lastY = 0;
  private touches: Map<number, { x: number; y: number }> = new Map();
  private initialPinchDistance = 0;

  constructor(element: HTMLElement, callbacks: InputCallback) {
    this.element = element;
    this.callbacks = callbacks;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse wheel
    this.element.addEventListener('wheel', this.handleWheel, { passive: false });

    // Mouse events
    this.element.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);
    this.element.addEventListener('touchcancel', this.handleTouchEnd);

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);

    // Prevent context menu
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public destroy(): void {
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    if (this.callbacks.onWheel) {
      this.callbacks.onWheel(e.deltaY, e.clientX, e.clientY);
    }
  };

  private handleMouseDown = (e: MouseEvent): void => {
    // Mouse panning disabled - only touch and keyboard navigation available
  };

  private handleMouseMove = (e: MouseEvent): void => {
    // Mouse panning disabled - only touch and keyboard navigation available
  };

  private handleMouseUp = (e: MouseEvent): void => {
    // Mouse panning disabled - only touch and keyboard navigation available
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();

    // Update touch tracking
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.initialPinchDistance = this.distance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = this.distance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );

      if (this.initialPinchDistance > 0) {
        const scale = currentDistance / this.initialPinchDistance;
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        // Convert pinch to wheel-like zoom
        const deltaY = (1 - scale) * 100;
        if (this.callbacks.onWheel) {
          this.callbacks.onWheel(deltaY, centerX, centerY);
        }

        this.initialPinchDistance = currentDistance;
      }
    }

    // Update touch tracking
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    // Remove ended touches
    const activeTouchIds = new Set<number>();
    for (let i = 0; i < e.touches.length; i++) {
      activeTouchIds.add(e.touches[i].identifier);
    }

    const toDelete: number[] = [];
    this.touches.forEach((_, id) => {
      if (!activeTouchIds.has(id)) {
        toDelete.push(id);
      }
    });
    toDelete.forEach((id) => this.touches.delete(id));

    if (e.touches.length === 0) {
      this.initialPinchDistance = 0;
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Pass to callback for app-level handling
    if (this.callbacks.onKeyDown) {
      this.callbacks.onKeyDown(e.key, e);
    }

    // Built-in keyboard navigation - only zoom, no pan
    const zoomAmount = 50;

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        if (this.callbacks.onWheel) {
          const rect = this.element.getBoundingClientRect();
          this.callbacks.onWheel(
            -zoomAmount,
            rect.width / 2,
            rect.height / 2
          );
        }
        break;

      case '-':
      case '_':
        e.preventDefault();
        if (this.callbacks.onWheel) {
          const rect = this.element.getBoundingClientRect();
          this.callbacks.onWheel(
            zoomAmount,
            rect.width / 2,
            rect.height / 2
          );
        }
        break;
    }
  };

  private startPan(x: number, y: number): void {
    this.isPanning = true;
    this.lastX = x;
    this.lastY = y;
    this.element.style.cursor = 'grabbing';

    if (this.callbacks.onPanStart) {
      this.callbacks.onPanStart();
    }
  }

  private updatePan(x: number, y: number): void {
    if (!this.isPanning) return;

    const deltaX = x - this.lastX;
    const deltaY = y - this.lastY;

    if (this.callbacks.onPan) {
      this.callbacks.onPan(deltaX, deltaY);
    }

    this.lastX = x;
    this.lastY = y;
  }

  private endPan(): void {
    if (!this.isPanning) return;

    this.isPanning = false;
    this.element.style.cursor = '';

    if (this.callbacks.onPanEnd) {
      this.callbacks.onPanEnd();
    }
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

