// Material class
class Material {
  constructor(name, type, color) {
    this.name = name;
    this.type = type; 
    this.color = color;
  }
  
  static getSelectOptions() {
    return `
      <option value="material">Select Material</option>
      <option value="concrete">Concrete</option>
      <option value="steelIdeal">Steel Ideal</option>
      <option value="steelHardening">Steel Hardening</option>
    `;
  }
  
  // Method to create input fields specific to each Material
  static createInputs({} = {}) {
    return ''; // Default implementation returns no inputs
  }
  
  getPropertiesTable() {
    let table = `<tr><td>Name</td><td>${this.name}</td></tr>`;
    table += `<tr><td>Type</td><td>${this.type}</td></tr>`;
    return table
  }
  
  updateProperties(props) {
    // For each property in props, update the material's properties
    for (const key in props) {
        if (this.hasOwnProperty(key)) {
            this[key] = props[key];
        }
    }
  }
  
  toJson() {
    return {
      name: this.name,
      type: this.type,
    };
  }
}

class Concrete extends Material {
    constructor(name, fc) {
        super(name, 'Concrete', 'blue');
        this.fc = fc;
    }
    
    static createInputs({fc = 20e6} = {}) {
        return `
          <div id="concreteInputs" class="material-inputs">
            <label for="fc">Comp. Strength (MPa):</label>
            <input type="number" id="fc" value="${fc/1e6}">
          </div>
        `;
    }
    
    getPropertiesTable() {
        // Begin table
        let table = `<table>`;
        
        // Add rows for name and type
        table += super.getPropertiesTable();
        
        table += `<tr><td>Comp. Str. (MPa)</td><td>${this.fc / 1e6}</td></tr>`;
        
        table += `</table>`;
        
        return table
    }
  
    toJson() {
        return {
            ...super.toJson(),
            variables: {fc: this.fc},
        };
    }
}

class SteelIdeal extends Material {
    
    constructor(name, young, fy, eu) {
    
        super(name, 'SteelIdeal', 'red');
        
        this.young = young;
        this.fy = fy;
        this.eu = eu;

    }
    
    static createInputs({young = 210e9, fy = 500e6, eu = 1e-2} = {}) {
    return `
        <div id="steelInputs" class="material-inputs">
            <label for="young">Young's Modulus (GPa):</label>
            <input type="number" id="young" value="${young/1e9}">
            <label for="fy">Yield Strength (MPa):</label>
            <input type="number" id="fy" value="${fy/1e6}">
            <label for="eu">Ultimate Strain (%):</label>
            <input type="number" id="eu" value="${eu*1e2}">
        </div>
        `;
    }
    
    getPropertiesTable() {
        // Begin table
        let table = `<table>`;
        
        // Add rows for name and type
        table += super.getPropertiesTable();
        
        table += `<tr><td>Young's Modulus (GPa)</td><td>${this.young / 1e9}</td></tr>`;
        table += `<tr><td>Yield Strength (MPa)</td><td>${this.fy / 1e6}</td></tr>`;
        table += `<tr><td>Ultimate Strain (%)</td><td>${this.eu * 1e2}</td></tr>`;
        
        table += `</table>`;
        
        return table
    }
    
    toJson() {
        return {
            ...super.toJson(),
            variables: {
                young: this.young,
                fy: this.fy,
                ultimate_strain: this.eu
            }
        };
    }
}

class SteelHardening extends Material {
    
    constructor(name, young, fy, ft, eu) {
    
        super(name, 'SteelHardening', 'green');
        
        this.young = young;
        this.fy = fy;
        this.ft = ft;
        this.eu = eu;

    }
    
    static createInputs({young = 200e9, fy = 1500e6, ft = 1700e6, eu = 3.5e-2} = {}) {
    return `
        <div id="steelInputs" class="material-inputs">
            <label for="young">Young's Modulus (GPa):</label>
            <input type="number" id="young" value="${young/1e9}">
            <label for="fy">Yield Strength (MPa):</label>
            <input type="number" id="fy" value="${fy/1e6}">
            <label for="ft">Ultimate Strength (MPa):</label>
            <input type="number" id="ft" value="${ft/1e6}">
            <label for="eu">Ultimate Strain (%):</label>
            <input type="number" id="eu" value="${Math.round((eu*1e2)*100)/100}">
        </div>
        `;
    }
    
    getPropertiesTable() {
        // Begin table
        let table = `<table>`;
        
        // Add rows for name and type
        table += super.getPropertiesTable();
        
        table += `<tr><td>Young's Modulus (GPa)</td><td>${this.young / 1e9}</td></tr>`;
        table += `<tr><td>Yield Strength (MPa)</td><td>${this.fy / 1e6}</td></tr>`;
        table += `<tr><td>Ultimate Strength (MPa)</td><td>${this.ft / 1e6}</td></tr>`;
        table += `<tr><td>Ultimate Strain (%)</td><td>${Math.round((this.eu*1e2)*100)/100}</td></tr>`;
        table += `</table>`;
        
        return table
    }
    
    toJson() {
        return {
            ...super.toJson(),
            variables: {
                young: this.young,
                fy: this.fy,
                ft: this.ft,
                ultimate_strain: this.eu
            }
        };
    }
}