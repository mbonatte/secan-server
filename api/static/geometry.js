// Geometry class 
class Geometry {

  constructor(center, type, material) {
    this.center = center;
    this.type = type;
    this.material = material;
    this.selected = false;
  }
  
  static getSelectOptions() {
    return `
      <option value="geometry">Select Geometry</option>
      <option value="rectangle">Rectangle</option>
      <option value="rebar">Rebar</option>
      <option value="tendon">Tendon</option>
    `;
  }
  
  // Method to generate specific geometry inputs
  static createInputs() {
    return ''; // Default implementation for base class
  }
  
  toJson() {
    return {
      type: this.type,
      material: this.material.name,
      center: this.center,
    };
  }
  
  // Method to check if a point is inside the geometry
  isClicked(mouseX, mouseY) {
    return false;
  }

  validateInput() {
    // Validation logic
  }

  renderPreview() {
    // Draw geometry on canvas
  }
  
  draw() {
    // Render on canvas
  }
  
  highlight(ctx) {
    if (this.selected) {
        ctx.strokeStyle = 'purple'; // Stroke color for highlighting
        ctx.lineWidth = 3; // Thicker border for selected geometry
        ctx.stroke();
    }
  }
}

class Rectangle extends Geometry {

  constructor(center, material, width, height) {
    
    super(center, 'RectSection', material);
    
    this.width = width;
    this.height = height;
    
    this.bottom_left = [center[0] - width/2, center[1] - height/2]

  }
  
  static createInputs() {
    return `
        <div class="geometry-inputs">
            <label for="widthInput">Width (cm):</label>
            <input type="number" id="widthInput" value="20">
            <label for="heightInput">Height (cm):</label>
            <input type="number" id="heightInput" value="50">
        </div>
    `;
  }
  
  toJson() {
    return {
      ...super.toJson(),
      variables: {
        width: this.width,
        height: this.height,
      }
    };
  }
  
  isClicked(scaledMouseX, scaledMouseY) {
    return (
      scaledMouseX >= this.bottom_left[0] && scaledMouseX <= this.bottom_left[0] + this.width &&
      scaledMouseY >= this.bottom_left[1] && scaledMouseY <= this.bottom_left[1] + this.height
    );
  }

  draw(ctx, offsetX, offsetY, scale) {
    const scaledX = (this.bottom_left[0] - offsetX) * scale;
    const scaledY = (this.bottom_left[1] - offsetY) * scale;
    
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;
    
    ctx.beginPath();
    ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
    ctx.fillStyle = this.material.color;
    ctx.fill();
    this.highlight(ctx);
    ctx.closePath();
  }

}

class Rebar extends Geometry {

  constructor(center, material, diameter, type = 'Rebar') {
   
    super(center, type, material);

    this.radius = diameter / 2;
  
  }
  
  static createInputs() {
    return `
        <div class="geometry-inputs">
            <label for="diameterInput">Diameter (mm):</label>
            <input type="number" id="diameterInput" value="10">
        </div>
    `;
  }
  
  toJson() {
    return {
      ...super.toJson(),
      variables: {
        diameter: this.radius * 2
      }
    };
  }
  
  isClicked(scaledMouseX, scaledMouseY) {
    // Calculate distance from the center to the point using adjusted coordinates
    const dx = scaledMouseX - this.center[0];
    const dy = scaledMouseY - this.center[1];

    // Check if the distance is less than the radius
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
  
  draw(ctx, offsetX, offsetY, scale) {
    const scaledX = (this.center[0] - offsetX) * scale;
    const scaledY = (this.center[1] - offsetY) * scale;
    const scaledRadius = this.radius * scale;
      
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, scaledRadius, 0, 2 * Math.PI);
    ctx.fillStyle = this.material.color;
    ctx.fill();
    this.highlight(ctx);
    ctx.closePath();
  }

}


class Tendon extends Rebar {

  constructor(center, material, diameter, initial_strain) {
   
    super(center, material, diameter, 'Tendon');
    
    this.initial_strain = initial_strain;
  
  }
  
  static createInputs() {
    return `
        <div class="geometry-inputs">
            <label for="diameterInput">Diameter (mm):</label>
            <input type="number" id="diameterInput" value="10">
            <label for="initial_strain">Initial strain (%):</label>
            <input type="number" id="initial_strain" value="0.1">
        </div>
    `;
  }
  
  toJson() {
    return {
      ...super.toJson(),
      variables: {
        diameter: this.radius * 2,
        initial_strain: this.initial_strain
      }
    };
  }
}