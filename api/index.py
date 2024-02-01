import json

from flask import Flask, request, jsonify
from typing import Dict, Callable, Any

import secan as sa

app = Flask(__name__)

@app.route('/')
def index():
    return 'Website Under Construction'

@app.route("/calculate/<function_name>", methods=['POST'])
def calculate(function_name: str) -> Any:
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        section = create_section_from_json(json_data)
        kwargs = {key: float(value) for key, value in request.args.items()}

        calculation_function = function_map.get(function_name)
        if calculation_function:
            result = calculation_function(section, **kwargs)
            return jsonify(result)
        else:
            return jsonify({"error": "Function not found"}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def calculate_moment_curvature(section: sa.Section, **kwargs) -> Dict[str, Any]:
    k_max = kwargs.get('k_max')
    normal_force = kwargs.get('normal_force', 0)
    moment_curvature = section.get_moment_curvature(k_max, normal_force)
    return {
        'curvature': list(moment_curvature[0]),
        'moment': list(moment_curvature[1]),
    }

def calculate_check_section(section: sa.Section, **kwargs) -> Dict[str, Any]:
    target_normal = kwargs.get('target_normal')
    target_moment = kwargs.get('target_moment')
    e0, k = section.check_section(target_normal, target_moment)
    return {'e0': e0, 'k': k}

function_map = {
    'moment_curvature': calculate_moment_curvature,
    'check_section': calculate_check_section,
}

def create_section_from_json(json_data: Dict[str, Any]) -> sa.Section:
    # Parse JSON data
    data = json.loads(json_data)
    
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
    section._compute_centroid()

    return section

def material_factory(mat_type, **mat_variables):
    if mat_type == 'Concrete':
        return sa.material.Concrete(**mat_variables)
    if mat_type == 'SteelIdeal':
        return sa.material.SteelIdeal(**mat_variables)

def geometry_factory(geom_type, material, **geom_variables):
    if geom_type == 'RectSection':
        return sa.geometry.RectSection(material=material, **geom_variables)
    if geom_type == 'Rebar':
        return sa.geometry.Rebar(material=material, **geom_variables)

if __name__ == '__main__':
    app.run(debug=True)  # Enable debug mode for development purposes
