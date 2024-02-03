const materialManager = new MaterialManager();
const geometryManager = new GeometryManager(materialManager);

const canvasManager = new CanvasManager('canvasGeometry', geometryManager);




// Initialize the page with a beam

materialManager.addMaterial(new Concrete('Concrete 25', 25e6));
materialManager.addMaterial(new SteelIdeal('Steel 500', 210e9, 500e6, 0.01));
materialManager.addMaterial(new SteelHardening('Strand 1700', 200e9, 1500e6, 1700e6, 0.035));

geometryManager.addGeometry(new Rectangle([-1.5,0.8], materialManager.materials[0], 0.4, 1.6));
geometryManager.addGeometry(new Rectangle([1.5,0.8], materialManager.materials[0], 0.4, 1.6));
geometryManager.addGeometry(new Rectangle([0.0,1.75], materialManager.materials[0], 6.5, 0.3));

// Rebars
const center = [-1.5,1.5];

const bar_pos = [-0.17, -0.14, -0.11, -0.08, 
                  0.17,  0.14,  0.11,  0.08]

const spacing = 0.04;

for (let i = 0; i < center.length; i += 1) {
    for (let j = 0; j < bar_pos.length; j += 1) {
        for (let x = 0; x < 4; x += 1) {
            geometryManager.addGeometry(new Rebar([Math.round((bar_pos[j]+center[i]) * 100) / 100, Math.round((0.05+x*spacing) * 100) / 100], materialManager.materials[1], 0.01905));
        }
    }
    geometryManager.addGeometry(new Rebar([-0.17+center[i], 0.21], materialManager.materials[1], 0.01905));
    geometryManager.addGeometry(new Rebar([ 0.17+center[i], 0.21], materialManager.materials[1], 0.01905));
}

// Tendons
geometryManager.addGeometry(new Tendon([-1.5, 0.13], materialManager.materials[2], 0.03, 0.01));
geometryManager.addGeometry(new Tendon([ 1.5, 0.13], materialManager.materials[2], 0.03, 0.01));


canvasManager.updateCanvas();

// Call setupUI to initialize canvas navigation buttons
setupUI();