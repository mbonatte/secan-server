// Utility function to toggle display elements
function toggleDisplay(elementId, displayStyle) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = displayStyle;
  }
}

// Utility function to add HTML content to an element
function updateHtmlContent(elementId, htmlContent) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = htmlContent;
  }
}

// Generic function to handle button click events
function handleButtonClick(buttonId, onClick) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.addEventListener('click', onClick);
  }
}

// Initialize UI components and event listeners
function setupUI() {
  // initially setup for geometry
  geometrySetup();
  
  // Setup for "Geometry"
  handleButtonClick('geometry-button', geometrySetup);
  
  // Setup for "Moment-Curvature"
  handleButtonClick('moment-curvature-button', momentCurvatureSetup);
  
  // Setup for "Interaction-Diagram"
  handleButtonClick('interaction-diagram-button', interactionDiagramSetup);
  
  // Setup for "Stress-Strain"
  handleButtonClick('stress-strain-button', stressStrainSetup);
}

// Geometry setup
function geometrySetup() {
    toggleDisplay('resultContainer', 'none');
    toggleDisplay('geometryContainer', 'block');
    
    geometryManager.updateSectionInfo();
    
    const clearCanvasButton = document.getElementById('clearCanvasButton');
    clearCanvasButton.addEventListener('click', () => {
        geometryManager.geometries.length = 0;
        canvasManager.updateCanvas();
        geometryManager.updateSectionInfo();
    });

    const deleteCanvasButton = document.getElementById('deleteCanvasButton');
    deleteCanvasButton.addEventListener('click', () => {
        canvasManager.deleteSelectedGeometry();
        geometryManager.updateSectionInfo();
    });
    
    handleButtonClick('exportSectionButton', exportSection);
    handleButtonClick('importSectionButton', importSection);
}

// Geometry - Export
function exportSection() {
    const jsonToDownload = geometryManager.getSectionJSON();
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonToDownload], { type: 'application/json' });

    // Create an anchor element and set its href to the blob URL
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'section.json';

    // Append the anchor to the document, trigger the download, then remove the anchor
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the blob URL to free up resources
    URL.revokeObjectURL(url);
}

// Geometry - Import
function importSection() {
    document.getElementById('jsonFileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            try {
                geometryManager.setSectionJSON(content);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        };

        reader.onerror = function() {
            console.error('Error reading file');
            document.getElementById('output').textContent = 'Error reading file';
        };

        reader.readAsText(file);
    });
    
    document.getElementById('jsonFileInput').click();
}


// Moment-Curvature setup
function momentCurvatureSetup() {
    toggleDisplay('geometryContainer', 'none');
    toggleDisplay('resultContainer', 'block');

    // Show the momentCurvatureChart
    createChart('resultChart', [], [], 'Curvature (1/m)', 'Moment (kN.m)', 'Moment-Curvature Relationship');
    
    updatePropertiesInfo("Moment-Curvature", "");
  
    const content = `<label for="k_max">Max curvature (1/m):</label>
        <input type="number" id="k_max" value=0.01>
        <label for="normal_force">Normal force (kN):</label>
        <input type="number" id="normal_force" value=0>
        <button id="calculateMomentCurvatureButton">Calculate</button>`;
    
    updateHtmlContent('resultParameters', content);
    handleButtonClick('calculateMomentCurvatureButton', momentCurvatureCalculation);
}

// Moment-Curvature calculation
async function momentCurvatureCalculation() {
  const sectionJson = geometryManager.getSectionJSON();
  const k_max = document.getElementById('k_max').value;
  const normal_force = document.getElementById('normal_force').value * 1e3;
  const parameters = { k_max, normal_force };
  // const parameters = {
          // k_max: k_max,
          // normal_force: normal_force
        // };
  const apiEndpoint = '/calculate/moment_curvature';
  const data = await makeApiRequest(apiEndpoint, parameters, sectionJson);
  if (data) {
    const data_x = data.curvature;
    const data_y = data.moment.map(moment => 1e-3 * moment);
    createChart('resultChart', data_x, data_y, 'Curvature (1/m)', 'Moment (kN.m)', 'Moment-Curvature Relationship');
    
    let table = `<table>`;
    table += `<tr><td>Max. moment (kN.m)</td><td>${Math.max(...data_y).toFixed(2)}</td></tr>`;    
    table += `</table>`;
    updatePropertiesInfo("Moment-Curvature", table);
  }
}


// Stress-Strain setup
function stressStrainSetup() {
    toggleDisplay('geometryContainer', 'none');
    toggleDisplay('resultContainer', 'block');
  
    const canvas = document.getElementById('resultChart');
    const ctx = canvas.getContext('2d');
    let existingChart = Chart.getChart('resultChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    updatePropertiesInfo("Stress-Strain", "");
  
    const content = `<label for="normal_force">Normal force (kN):</label>
        <input type="number" id="normal_force" value=0>
        <label for="moment_force">Moment (kN.m):</label>
        <input type="number" id="moment_force" value=0>
        <button id="calculateStressStrainButton">Calculate</button>`;
    updateHtmlContent('resultParameters', content);
    handleButtonClick('calculateStressStrainButton', stressStrainCalculation);
}

// Stress-Strain calculation
async function stressStrainCalculation() {
    const sectionJson = geometryManager.getSectionJSON();
        
    const target_normal = document.getElementById('normal_force').value * 1e3;
    const target_moment = document.getElementById('moment_force').value * 1e3;
    const parameters = {
      target_normal: target_normal,
      target_moment: target_moment
    };
    
    const apiEndpoint = '/calculate/check_section';
    
    const data = await makeApiRequest(apiEndpoint, parameters, sectionJson);

    if (data) {
        const canvas = document.getElementById('resultChart');
        const ctx = canvas.getContext('2d');
        
        const imageBase64 = data.image; // Get the base64 encoded image from the response
        const e0 = data.e0;
        const k = data.k;
        
        // Load the image and draw it on the canvas
        const image = new Image();
        image.onload = function() {
            // Adjust canvas size to image size
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
            ctx.drawImage(image, 0, 0);
        };
        image.src = `data:image/png;base64,${imageBase64}`;
        
        let table = `<table>`;
        table += `<tr><td>e0 (-)</td><td>${e0.toFixed(5)}</td></tr>`;
        table += `<tr><td>k (1/m)</td><td>${k.toFixed(5)}</td></tr>`;
        table += `</table>`;
        updatePropertiesInfo("Stress-Strain", table);
    }
}


// Interaction Diagram setup
async function interactionDiagramSetup() {
    toggleDisplay('geometryContainer', 'none');
    toggleDisplay('resultContainer', 'block');

    // Show the interactionDiagramChart
    createChart('resultChart', [], [], 'Normal (kN)', 'Moment (kN.m)', 'Interaction Diagram');
    
    updatePropertiesInfo("Interaction Diagram", '');
    
    const content = "";
    
    updateHtmlContent('resultParameters', content);
    
    const sectionJson = geometryManager.getSectionJSON();
    
    const apiEndpoint = '/calculate/interaction_diagram';
    
    const data = await makeApiRequest(apiEndpoint, [], sectionJson);
    
    if (data) {
        const data_x = data.normal.map(normal => 1e-3*normal);
        const data_y = data.moment.map(moment => 1e-3*moment);
        createChart('resultChart', data_x, data_y, 'Normal (kN)', 'Moment (kN.m)', 'Interaction Diagram');
    }
}