// Function to add HTML content
function addHtmlContent(elementId, content) {
    // Get the container element
    var container = document.getElementById(elementId);
    
    container.innerHTML = "";

    // Create a div element to hold the new content
    var newContent = document.createElement("div");
    newContent.innerHTML = content;

    // Append the new content to the container
    container.appendChild(newContent);
}

function getDataFromDivContainer(divId) {
    // Find the container div by its ID
    const container = document.getElementById(divId);

    // Find all input elements within the container
    const inputs = container.querySelectorAll('input[type="number"]');

    // Initialize an object to hold the data
    let data = {};

    // Iterate over each input to extract the ID and value
    inputs.forEach(input => {
        // Use the input's ID as the key and its numeric value as the value
        data[input.id] = parseFloat(input.value);
    });

    // Return the collected data
    return data;
}

function getMaterialInputHtml(){
    return `
            <fieldset>
                <label for="materialType">Material Type:</label>
                <select aria-label="Material Type" id="materialType" onchange="toggleMaterialInputs()">
                    ${Material.getSelectOptions()}
                </select>
                <hr>
                <div id="materialInputs"></div>
                <br>
                <button id="insert-material" onclick="handleInsertMaterial()">Insert Material</button>
            </fieldset>
        `;
}

function getGeometryInputHtml(){
    return `
          <fieldset>
            <label for="geometryType">Geometry Type:</label>
            <select aria-label="Geometry Type" id="geometryType" onchange="toggleGeometryInputs()">
              ${Geometry.getSelectOptions()}
            </select>
            <hr>
            <div id="geometryInputs"></div>
            <br>
            <button id="insert-geometry" onclick="handleInsertGeometry()">Insert Geometry</button>
          </fieldset>
        `;
}

function toggleFields(fieldType) {
    const inputField = document.getElementById('inputField');
    inputField.style.display = 'block';

    if (fieldType === 'Material') {
        inputField.innerHTML = getMaterialInputHtml();
    } else if (fieldType === 'Geometry') {
        inputField.innerHTML = getGeometryInputHtml();
  }
}

// MATERIAL

function toggleMaterialInputs() {
  const materialType = document.getElementById('materialType').value;
  
  let htmlContent = Material.createInputs();

  switch (materialType) {
    case 'concrete':
      htmlContent = Concrete.createInputs();
      break;
    case 'steelIdeal':
      htmlContent = SteelIdeal.createInputs();
      break;
    case 'steelHardening':
      htmlContent = SteelHardening.createInputs();
      break;
    default:
      htmlContent = Material.createInputs(); // Handles case 'material' or any other case
  }

  addHtmlContent("materialInputs", htmlContent);
}

function handleInsertMaterial() {
    const materialType = document.getElementById('materialType').value;
    const materialName = prompt('Enter material name:');
    if (!materialName) return;
        
    const data = getDataFromDivContainer('materialInputs');
    
    materialManager.setMaterial(materialType, materialName, data);
  
    // Clear the input fields
    document.getElementById("materialInputs").innerHTML = "";
    document.getElementById('materialType').value = 'material';
}

// GEOMETRY

function toggleGeometryInputs() {
    const geometryType = document.getElementById('geometryType').value;
    
    let htmlContent = Geometry.createInputs();
    
    switch (geometryType) {
        case 'rectangle':
          htmlContent = Rectangle.createInputs();
          break;
        case 'rebar':
          htmlContent = Rebar.createInputs();
          break;
        case 'tendon':
          htmlContent = Tendon.createInputs();
          break;
        default:
          htmlContent = Geometry.createInputs();
          return;
      }
    
    // Always include position and material selection fields
      htmlContent += `
        <div id="geometryPosition">
            <br>
            <div class="geometry-inputs">
                <label for="xInput">X Center (cm):</label>
                <input type="number" id="xInput" value="0">
                <label for="yInput">Y Center (cm):</label>
                <input type="number" id="yInput" value="0">
            </div>
        </div>
        <br>
        <label for="materialSelection">Select Material:</label>
        <select id="materialSelection"></select>
      `;
    
    addHtmlContent("geometryInputs", htmlContent);
    
    // Add the material to the material selection dropdown in the geometry section
    updateMaterialSelection();
}

function updateMaterialSelection() {
    const materialSelection = document.getElementById('materialSelection');
    materialSelection.innerHTML = '<option value="">Select Material</option>';

    materialManager.materials.forEach((material, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = material.name;
        materialSelection.appendChild(option);
    });
}

function handleInsertGeometry() {
    const geometryType = document.getElementById('geometryType').value;
    const materialIndex = document.getElementById('materialSelection').value;

    if (materialIndex === '') {
    alert('Please select a material.');
    return;
    }
    const material = materialManager.materials[materialIndex];
    
    const data = getDataFromDivContainer('geometryInputs');
    
    geometryManager.setGeometry(geometryType, material, data);
  
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('geometryContainer').style.display = 'block';
    canvasManager.updateCanvas();
    geometryManager.updateSectionInfo();
  
    // Clear the input fields
    document.getElementById("geometryInputs").innerHTML = "";
    document.getElementById('geometryType').value = 'geometry';
}