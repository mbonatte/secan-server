class MaterialManager {
  constructor() {
    this.materials = [];
  }

  addMaterial(material) {
    if (this.isMaterialNameDuplicate(material.name)) {
      alert('Material with this name already exists. Please choose a different name.');
      return false;
    }
    
    this.materials.push(material);
    console.log(`DEBUGGING - insertMaterial - ${material.name} - ${material.type}`);
    this.updateMaterialListUI();
    return true;
  }
  
  isMaterialNameDuplicate(name) {
    return this.materials.some(material => material.name === name);
  }
  
  setMaterial(materialType, materialName, data) {
    let material;
    if (materialType === 'concrete') {
    const fc = data.fc * 1e6;
    material = new Concrete(materialName, fc);
    } else if (materialType === 'steelIdeal') {
    const young = data.young * 1e9;
    const fy = data.fy * 1e6;
    const eu = data.eu * 1e-2;
    material = new SteelIdeal(materialName, young, fy, eu);
    } else if (materialType === 'steelHardening') {
    const young = data.young * 1e9;
    const fy = data.fy * 1e6;
    const ft = data.ft * 1e6;
    const eu = data.eu * 1e-2;
    material = new SteelHardening(materialName, young, fy, ft, eu);
    }
    this.addMaterial(material);

  }

  updateMaterialListUI() {
    const materialsList = document.getElementById('materialsList');
    materialsList.innerHTML = '';
    
    this.materials.forEach((material, index) => {
      const optionItem = document.createElement('option');
      optionItem.value = index;
      optionItem.textContent = `${material.name} (${material.type})`;
      materialsList.appendChild(optionItem);
    });
    
    materialsList.onchange = (event) => {
        this.updateMaterialInfo(this.materials[event.target.value]);
      };
  }
  
  updateMaterialInfo(material) {
    updatePropertiesInfo("Material", material.getPropertiesTable());
    
    const infoDiv = document.getElementById('additional-properties-container');
    
    // // Add the "Edit" button at the bottom
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("button-container");
    buttonContainer.innerHTML = `<button id="edit-button">Edit</button>`;
    infoDiv.appendChild(buttonContainer);
    
    document.getElementById('edit-button').addEventListener('click', () => this.editMaterialInfo(material));
  }
  
  editMaterialInfo(material) {
    // Open formHtml div
    let formHtml = "<div id='editMaterialForm'>";
    
    // Add input for Name
    formHtml += `
      <div id="editNameForm">
          <label for="name">Name:</label>
          <input type="text" id="name" value="${material.name}">
      </div>
    `;
    
    // Add inputs for Material properties
    if (material instanceof Concrete) {
        formHtml += Concrete.createInputs(material);
    } else if (material instanceof SteelIdeal) {
        formHtml += SteelIdeal.createInputs(material);
    } else if (material instanceof SteelHardening) {
        formHtml += SteelHardening.createInputs(material);
    }
    
    // Add buttons
    formHtml += `
      <div>
          <button type="button" id="saveMaterialButton">Save</button>
          <button type="button" id="cancelButton">Cancel</button>
      </div>
    `;
    
    // Close formHtml div
    formHtml += "</div>";

    const infoDiv = document.getElementById('additional-properties-container');
    infoDiv.innerHTML = formHtml;
    
    // Add event listener to save button
    document.getElementById('saveMaterialButton').addEventListener('click', () => {
        const inputs = infoDiv.querySelectorAll('input');
        const props = {};
        
        inputs.forEach(input => {
            // Assuming input IDs match material property names directly
            props[input.id] = input.type === 'number' ? parseFloat(input.value) : input.value;
        });

        // Update the material object
        // material.updateProperties(props);
        material.name = props.name;
        if (material instanceof Concrete) {
            material.fc = props.fc * 1e6;
        } else if (material instanceof SteelIdeal) {
            material.young = props.young * 1e9;
            material.fy = props.fy * 1e6;
            material.eu = props.eu * 1e-2;
        } else if (material instanceof SteelHardening) {
            material.young = props.young * 1e9;
            material.fy = props.fy * 1e6;
            material.ft = props.ft * 1e6;
            material.eu = props.eu * 1e-2;
        }

        // Refresh UI to reflect changes
        this.updateMaterialListUI();
        this.updateMaterialInfo(material);
    });
    
    // Add event listener to cancel button
    document.getElementById('cancelButton').addEventListener('click', () => {
        this.updateMaterialListUI();
        this.updateMaterialInfo(material);
    });
    
  }
}