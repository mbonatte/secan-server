import json
import base64
from io import BytesIO
from typing import Dict, Callable, Any

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import secan as sa

from flask import Flask, request, jsonify, render_template, send_file


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html');

@app.route("/calculate/<function_name>", methods=['POST'])
def calculate(function_name: str) -> Any:
    calculation_function = function_map.get(function_name)
    if not calculation_function:
        return jsonify({"error": "Function not found"}), 404
    
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        section = create_section_from_json(json_data)
        kwargs = {key: float(value) for key, value in request.args.items()}
        result = calculation_function(section, **kwargs)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except sa.exceptions.SectionUnstableError as e:
        return jsonify({"error": "Section is unstable"}), 422
    except sa.exceptions.ConvergenceError as e:
        return jsonify({"error": "Fails to converge to a solution"}), 422
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

def calculate_geometry_properties(section: sa.Section, **kwargs) -> Dict[str, Any]:
    if section.centroid[0] != section.centroid[0]:
        return {}

    area_concrete = 0
    area_rebar = 0
    area_tendon = 0
    
    for sec in section.section:
        if type(sec) is sa.geometry.RectSection:
            area_concrete += sec.area
        if type(sec) is sa.geometry.Rebar:
            area_rebar += sec.area
        if type(sec) is sa.geometry.Tendon:
            area_tendon += sec.area

    return {
        'centroid': list(section.centroid),
        'area_concrete': area_concrete,
        'area_rebar': area_rebar,
        'area_tendon': area_tendon,
    }

def calculate_moment_curvature(section: sa.Section, **kwargs) -> Dict[str, Any]:
    k_max = kwargs.get('k_max')
    normal_force = kwargs.get('normal_force', 0)
    
    moment_curvature = section.get_moment_curvature(k_max, normal_force)    
    
    return {
        'curvature': list(moment_curvature[0]),
        'moment': list(moment_curvature[1]),
    }
    

def calculate_interaction_diagram(section: sa.Section, **kwargs) -> Dict[str, Any]:
    normal, moment = section.get_interaction_curve(50)
    return {
        'normal': list(normal),
        'moment': list(moment),
    }

def calculate_check_section(section: sa.Section, **kwargs) -> Dict[str, Any]:
    target_normal = kwargs.get('target_normal')
    target_moment = kwargs.get('target_moment')
    n_ite = kwargs.get('n_ite', 50)

    e0, k = section.check_section(target_normal, target_moment, n_ite)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
    section.plot_stress(e0, k, ax1)
    section.plot_strain(e0, k, ax2)
    
    # Save the plot to a bytes buffer
    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)  # Close the figure to free memory
    buf.seek(0)  # Rewind the buffer
    
    # Encode the image to base64
    image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    return {
        "image": image_base64,
        "e0": e0,
        "k": k
    }

function_map = {
    'geometry_properties': calculate_geometry_properties,
    'moment_curvature': calculate_moment_curvature,
    'check_section': calculate_check_section,
    'interaction_diagram': calculate_interaction_diagram,
}

def create_section_from_json(data: Dict[str, Any]) -> sa.Section:
    materials_data = data['materials']
    geometries_data = data['geometries']

    # Create materials instances
    materials = {mat['name']: material_factory(mat['type'], **mat['variables'])
                 for mat in materials_data}

    # Create geometries instances
    geometries = [geometry_factory(geom['type'], material=materials[geom['material']], center=geom['center'], **geom['variables'])
                  for geom in geometries_data]
    
    # Create a Section instance
    section = sa.Section(geometries)
    section.n_ite_e0 = 100
    section._compute_centroid()

    return section

def material_factory(mat_type, **mat_variables):
    if mat_type == 'Concrete':
        return sa.material.Concrete(**mat_variables)
    if mat_type == 'SteelIdeal':
        return sa.material.SteelIdeal(**mat_variables)
    if mat_type == 'SteelHardening':
        return sa.material.SteelHardening(**mat_variables)

def geometry_factory(geom_type, material, **geom_variables):
    if geom_type == 'RectSection':
        return sa.geometry.RectSection(material=material, **geom_variables)
    if geom_type == 'Rebar':
        return sa.geometry.Rebar(material=material, **geom_variables)
    if geom_type == 'Tendon':
        return sa.geometry.Tendon(material=material, **geom_variables)

if __name__ == '__main__':
    app.run(debug=True)  # Enable debug mode for development purposes
