class GeometryManager {
  constructor(materialManager) {
    this.geometries = [];
    this.materialManager = materialManager;
  }

  addGeometry(geometry) {
    // Validate and add geometry logic...
    console.log(`DEBUGGING - insertGeometry - ${geometry.type}`);
    this.geometries.push(geometry);
    // Additional logic to add geometry to canvas and update UI...
  }
  
  setGeometry(geometryType, material, data) {
    const x = data.xInput * 1e-2;
    const y = data.yInput * 1e-2;

    let geometry;
    if (geometryType === 'rectangle') {
        const width = data.widthInput * 1e-2;
        const height = data.heightInput * 1e-2;
        geometry = new Rectangle([x, y], material, width, height);
    } else if (geometryType === 'rebar') {
        const diameter = data.diameterInput * 1e-3;   
        geometry = new Rebar([x, y], material, diameter);
    } else if (geometryType === 'tendon') {
        const diameter = data.diameterInput * 1e-3;
        const initial_strain = data.initial_strain * 1e-2;
        geometry = new Tendon([x, y], material, diameter, initial_strain);
    }
    
    this.addGeometry(geometry);
  }

  async updateSectionInfo(){
    const apiEndpoint = '/calculate/geometry_properties';
    
    const data = await makeApiRequest(apiEndpoint, [], this.getSectionJSON());
    
    if (!data.centroid){
        updatePropertiesInfo("Geometry", '');
        return
    }
    
    // Begin table
    let table = `<table>`;
    
    table += `<tr><td>Centroid (cm)</td><td>(${(data.centroid[0]*1e2).toFixed(2)}, ${(data.centroid[1]*1e2).toFixed(2)})</td></tr>`;
    table += `<tr><td>Concrete (cm2)</td><td>${(data.area_concrete * 1e4).toFixed(2)}</td></tr>`;
    table += `<tr><td>Rebar (cm2)</td><td>${(data.area_rebar * 1e4).toFixed(2)}</td></tr>`;
    table += `<tr><td>Tendon (cm2)</td><td>${(data.area_tendon * 1e4).toFixed(2)}</td></tr>`;
    
    table += `</table>`;

    updatePropertiesInfo("Geometry", table);
  }
  
  updateGeometryInfo(geometry) {
    // Begin table
    let table = `<table>`;
    
    // Add rows for name and type
    table += `<tr><td>Type</td><td>${geometry.type}</td></tr>`;
    table += `<tr><td>Material</td><td>${geometry.material.name}</td></tr>`;
    table += `<tr><td>Center (cm)</td><td>(${geometry.center[0]*1e2}, ${geometry.center[1]*1e2})</td></tr>`;
    
    
    if (geometry.constructor === Rectangle) {
        table += `<tr><td>Width (cm)</td><td>${geometry.width*1e2}</td></tr>`;
        table += `<tr><td>Height (cm)</td><td>${geometry.height*1e2}</td></tr>`;
    } else if (geometry.constructor === Rebar) {
        table += `<tr><td>Diameter (mm)</td><td>${geometry.radius * 2 * 1e3}</td></tr>`;
    } else if (geometry.constructor === Tendon) {
        table += `<tr><td>Diameter (mm)</td><td>${geometry.radius * 2 * 1e3}</td></tr>`;
        table += `<tr><td>Initial strain (%)</td><td>${geometry.initial_strain * 1e2}</td></tr>`;
    }
    
    table += `</table>`;

    updatePropertiesInfo("Geometry", table);
    
  }
  
  getSectionJSON(){
    const finalJSON = {
    materials: this.materialManager.materials.map(material => material.toJson()),
    geometries: this.geometries.map(geometry => geometry.toJson()),
    };
    
    return JSON.stringify(finalJSON, null, 2);
  }
  
  setSectionJSON(jsonString) {
    const data = JSON.parse(jsonString);

    // Clear existing materials and geometries
    this.materialManager.materials.length = 0;
    this.geometries.length = 0;

    // Reconstruct materials
    if (data.materials) {
      data.materials.forEach(materialData => {
        let material;
        switch (materialData.type) {
          case 'Concrete':
            material = new Concrete(materialData.name, materialData.variables.fc);
            break;
          case 'SteelIdeal':
            material = new SteelIdeal(materialData.name, materialData.variables.young, materialData.variables.fy, materialData.variables.ultimate_strain);
            break;
          case 'SteelHardening':
            material = new SteelHardening(materialData.name, materialData.variables.young, materialData.variables.fy, materialData.variables.ft, materialData.variables.ultimate_strain);
            break;
          default:
            console.warn(`Unknown material type: ${materialData.type}`);
        }
        if (material) {
          this.materialManager.addMaterial(material);
        }
      });
    }

    // Reconstruct geometries
    if (data.geometries) {
      data.geometries.forEach(geometryData => {
        const material = this.materialManager.materials.find(m => m.name === geometryData.material);
        let geometry;
        switch (geometryData.type) {
          case 'RectSection':
            geometry = new Rectangle(geometryData.center, material, geometryData.variables.width, geometryData.variables.height);
            break;
          case 'Rebar':
            geometry = new Rebar(geometryData.center, material, geometryData.variables.diameter);
            break;
          case 'Tendon':
            geometry = new Tendon(geometryData.center, material, geometryData.variables.diameter, geometryData.variables.initial_strain);
            break;
          default:
            console.warn(`Unknown geometry type: ${geometryData.type}`);
        }
        if (geometry) {
          this.addGeometry(geometry); // Assuming addGeometry is a method for adding geometries
        }
      });
    }
    canvasManager.updateCanvas();
  }
}