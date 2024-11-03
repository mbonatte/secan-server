class CanvasManager {
    constructor(canvasId, geometryManager) {
        this.setupCanvas(canvasId);
        this.setupContext();
        this.setupInteractionFlags();
        this.setupGeometry(geometryManager);
        this.setupEventListeners();
        
        this.updateCanvas();
        this.updateScale(75);
        this.offsetY = -0.5;
    }
    
    setupCanvas(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scale = 1;
        this.offsetX = -this.canvas.offsetWidth / 2;
        this.offsetY = -this.canvas.offsetHeight / 2;
    }
    
    setupContext() {
        this.ctx = this.canvas.getContext('2d');
    }
    
    setupInteractionFlags() {
        this.isMouseInside = false;
        this.isDragging = false;
        this.mouseStartX = 0;
        this.mouseStartY = 0;
        this.lastTouchDistance = 0;
    }
    
    setupGeometry(geometryManager) {
        this.geometryManager = geometryManager;
        this.geometries = geometryManager.geometries;
        this.selectedGeometry = null;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.updateCanvas());
        window.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
 
  get projectionWidth() {
    const projection_x0 = this.offsetX;
    const projection_x1 = this.getScaledXY(this.canvas.width, 0)[0];
    
    return projection_x1 - projection_x0;
}

  get projectionHeight() {
    const projection_y0 = this.offsetY;
    const projection_y1 = this.getScaledXY(0, 0)[1];
    
    return projection_y1 - projection_y0;
}
 
  addGeometryToCanvas(geometry) {
      this.geometries.push(geometry);
      this.updateCanvas();
  }
  
  resetCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGridWithNumbers();
    this.drawOriginAxes();
  }
  
  updateCanvas() {
    let parentDiv = this.canvas.parentElement;
    if (window.getComputedStyle(parentDiv).display === 'none') {
        return;
    }
    
    this.resetCanvas();
    
    this.ctx.transform(1, 0, 0, -1, 0, this.canvas.height);
    this.geometries.forEach(geometry => geometry.draw(this.ctx, this.offsetX, this.offsetY, this.scale));
    this.ctx.transform(1, 0, 0, -1, 0, this.canvas.height);
}
  
  drawOriginAxes(){
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'black'; // Color of the grid lines
    
    this.ctx.moveTo(-this.offsetX*this.scale, 0);
    this.ctx.lineTo(-this.offsetX*this.scale, this.canvas.height);
    
    this.ctx.moveTo(0, this.offsetY*this.scale+this.canvas.height);
    this.ctx.lineTo(this.canvas.width, this.offsetY*this.scale+this.canvas.height);
    this.ctx.stroke();
    this.ctx.closePath();
  }
  
  drawGridWithNumbers() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    const fromCentiToMeter = 100;

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'lightgray'; // Color of the grid lines
    this.ctx.fillStyle = 'black'; // Color of the numbers
    this.ctx.font = '12px Arial'; // Font size and type

    // Vertical grid lines and numbers
    for (let x = 0; x <= canvasWidth; x += canvasWidth/10) {
        let gridValue = (x / this.scale) + this.offsetX;
        gridValue = Math.round(fromCentiToMeter * gridValue);
        
        const x_canvas = (gridValue/fromCentiToMeter - this.offsetX) * this.scale;
        
        this.ctx.moveTo(x_canvas, 0);
        this.ctx.lineTo(x_canvas, canvasHeight);

        // Draw numbers at the top of the grid
        this.ctx.fillText(gridValue, x_canvas - 10, 15);
    }

    // Horizontal grid lines and numbers
    for (let y = 0; y <= canvasHeight; y += canvasHeight/10) {
        let gridValue = (this.canvas.height - y) / this.scale + this.offsetY;
        gridValue = Math.round(fromCentiToMeter * gridValue);
        
        const y_canvas = this.canvas.height- (gridValue/fromCentiToMeter - this.offsetY) * this.scale;
        
        this.ctx.moveTo(0, y_canvas);
        this.ctx.lineTo(canvasWidth, y_canvas);

        // Draw numbers at the right side of the grid
        this.ctx.fillText(gridValue, canvasWidth - 30, y_canvas - 5);
    }
    
    this.ctx.stroke();
    this.ctx.closePath();
  }
  
  getScaledXY(x, y) {
    const scaledX = (x / this.scale) + this.offsetX;
    const scaledY = (this.canvas.height - y) / this.scale + this.offsetY
    return [scaledX, scaledY];
  }
  
  updateScale(scale_factor){
    this.offsetX = this.offsetX + (this.projectionWidth-this.projectionWidth/scale_factor)/2;
    this.offsetY = this.offsetY + (this.projectionHeight-this.projectionHeight/scale_factor)/2;
    
    this.scale *= scale_factor;
  }

  deleteSelectedGeometry (){
    if (this.selectedGeometry) {
        const index = this.geometries.indexOf(this.selectedGeometry);
        if (index !== -1) {
            this.geometries.splice(index, 1);
            this.selectedGeometry = null;
            this.updateCanvas();
            updatePropertiesInfo("", "");
        }
    }
  }

  handleMouseEnter() {
    this.isMouseInside = true;
    this.canvas.style.boxShadow = '0 0 10px 2px rgba(0, 0, 0, 0.5)';
  }

  handleMouseLeave() {
    this.isMouseInside = false;
    this.isDragging = false;
    this.canvas.style.boxShadow = 'none';
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    const dx = (e.clientX - this.startX) / this.scale;
    const dy = (e.clientY - this.startY) / this.scale;

    this.startX = e.clientX;
    this.startY = e.clientY;

    this.offsetX -= dx;
    this.offsetY += dy;

    this.updateCanvas();
}

  handleMouseUp(e) {
    this.isDragging = false;
}

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [scaledMouseX, scaledMouseY] = this.getScaledXY(mouseX, mouseY);

    this.selectedGeometry = null;
    
    // Loop through geometries to find the one that's clicked
    this.geometries.forEach((geometry) => {
        if (geometry.isClicked(scaledMouseX, scaledMouseY)) {
            this.selectedGeometry = geometry;
            geometry.selected = true; // Mark as selected
        } else {
            geometry.selected = false; // Deselect others
        }
    });
    
    if (this.selectedGeometry) {
        this.geometryManager.updateGeometryInfo(this.selectedGeometry);
        this.updateCanvas();
    }
  }

  handleMouseWheel(e) {
    e.preventDefault(); // Prevent the page from scrolling

    const scale_factor = 1.1; // Adjust this value as needed

    if (e.deltaY < 0) {
    // Scrolling up, zoom in
    this.updateScale(scale_factor);
    } else if (e.deltaY > 0) {
    // Scrolling down, zoom out
    this.updateScale(1 / scale_factor);
    }

    this.updateCanvas();
}
    
    handleTouchStart(e) {
        e.preventDefault();
        this.isDragging = true;
        
        if (e.touches.length === 1) {
            // Single touch for panning
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Two touches for pinch-zoom
            this.lastTouchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        if (e.touches.length === 1) {
            // Handle panning
            const dx = (e.touches[0].clientX - this.startX) / this.scale;
            const dy = (e.touches[0].clientY - this.startY) / this.scale;
            
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            
            this.offsetX -= dx;
            this.offsetY += dy;
            
            this.updateCanvas();
        } else if (e.touches.length === 2) {
            // Handle pinch-zoom
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            if (this.lastTouchDistance) {
                const scale_factor = currentDistance / this.lastTouchDistance;
                
                // Only zoom if the change is significant enough
                if (Math.abs(1 - scale_factor) > 0.02) {
                    this.updateScale(scale_factor);
                    this.updateCanvas();
                }
            }
            
            this.lastTouchDistance = currentDistance;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
        this.lastTouchDistance = 0;
        
        // Handle tap for selection
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const [scaledTouchX, scaledTouchY] = this.getScaledXY(touchX, touchY);
            
            this.selectedGeometry = null;
            
            this.geometries.forEach((geometry) => {
                if (geometry.isClicked(scaledTouchX, scaledTouchY)) {
                    this.selectedGeometry = geometry;
                    geometry.selected = true;
                } else {
                    geometry.selected = false;
                }
            });
            
            if (this.selectedGeometry) {
                this.geometryManager.updateGeometryInfo(this.selectedGeometry);
                this.updateCanvas();
            }
        }
    }

  handleEscape(){
    this.selectedGeometry = null;
    this.geometries.forEach((geometry) => {
        geometry.selected = false; // Deselect others
    });
    this.updateCanvas();
    updatePropertiesInfo("", "");
    this.geometryManager.updateSectionInfo();
  }
  
  handleKeyPress(e) {
    if (!this.isMouseInside) return;
    
    const speed = 10/this.scale;
    const scale_factor = 1.2;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
        case '+':
        case '-':
            e.preventDefault(); // Prevent the default action for these keys
            break;
        default:
            break;
    }
    
    switch (e.key) {
      case "Escape": this.handleEscape(); break;
      case 'ArrowLeft': this.offsetX -= speed; break;
      case 'ArrowRight': this.offsetX += speed; break;
      case 'ArrowUp': this.offsetY += speed; break;
      case 'ArrowDown': this.offsetY -= speed; break;
      case '+': this.updateScale(scale_factor); break;
      case '-': this.updateScale(1/scale_factor); break;
      default: return;
    }
    
    this.updateCanvas();
  }
  
}

